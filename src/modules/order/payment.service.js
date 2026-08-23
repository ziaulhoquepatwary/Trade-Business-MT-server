import Stripe from "stripe";
import crypto from "crypto";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Antom Helper Functions ---
function formatPrivateKey(pem) {
    if (!pem) return '';
    if (pem.includes('-----BEGIN')) {
        return pem.replace(/\\n/g, '\n');
    }
    const wrapped = pem.match(/.{1,64}/g)?.join('\n') || pem;
    return `-----BEGIN RSA PRIVATE KEY-----\n${wrapped}\n-----END RSA PRIVATE KEY-----`;
}

function generateSignature(httpMethod, requestPath, clientId, requestTime, reqBody, privateKey) {
    const formattedPrivateKey = formatPrivateKey(privateKey);
    const stringToSign = `${httpMethod} ${requestPath}\n${clientId}.${requestTime}.${reqBody}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(stringToSign, 'utf8');
    return sign.sign({
        key: formattedPrivateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, 'base64');
}
// ------------------------------

const generatePayPalSession = async (orderId, amount) => {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
    const tokenRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
    });
    const tokenData = await tokenRes.json();

    const paypalOrderRes = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenData.access_token}`
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
                reference_id: orderId.toString(),
                amount: { currency_code: "USD", value: amount.toString() }
            }],
            application_context: {
                return_url: `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled?orderId=${orderId}`
            }
        })
    });

    const paypalOrderData = await paypalOrderRes.json();
    const approveLink = paypalOrderData.links?.find(link => link.rel === 'approve');

    if (!approveLink) throw new Error("PayPal session generation failed");

    return {
        transactionId: paypalOrderData.id,
        checkoutUrl: approveLink.href
    };
};

const generateStripeSession = async (orderId, amount, customerInfo, packageDetails) => {
    const sessionPayload = {
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: packageDetails?.title || "Agency Service",
                        description: `Order ID: ${orderId}`
                    },
                    unit_amount: Math.round(Number(amount) * 100),
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled?orderId=${orderId}`,
        client_reference_id: orderId.toString(),
        metadata: { orderId: orderId.toString() }
    };

    if (customerInfo?.email && customerInfo.email !== "Not Provided") {
        sessionPayload.customer_email = customerInfo.email;
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return {
        transactionId: session.id,
        checkoutUrl: session.url
    };
};

const generateAntomSession = async (orderId, amount, customerInfo, packageDetails) => {
    const requestPath = process.env.ANTOM_API_PATH || '/ams/api/v1/payments/createPaymentSession';
    const clientId = process.env.ANTOM_CLIENT_ID;
    const requestTime = new Date().toISOString();

    // We will use a unified webhook endpoint for all gateways later
    const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/antom`;
    const amountString = String(Math.round(Number(amount) * 100));

    const payload = {
        productCode: "CASHIER_PAYMENT",
        productScene: "CHECKOUT_PAYMENT",
        paymentRequestId: orderId.toString(),
        is3DSAuthentication: true,
        paymentAmount: { currency: "USD", value: amountString },
        order: {
            referenceOrderId: orderId.toString(),
            orderDescription: String(packageDetails?.title || "Agency Service"),
            orderAmount: { currency: "USD", value: amountString }
        },
        availablePaymentMethod: {
            paymentMethodTypeList: [
                { paymentMethodType: "CARD" },
                { paymentMethodType: "GOOGLEPAY", expressCheckout: false },
                { paymentMethodType: "APPLEPAY", expressCheckout: false }
            ]
        },
        buyer: {
            referenceBuyerId: customerInfo?.email || `GUEST_${Date.now()}`,
            ...(customerInfo?.name && customerInfo.name !== "Guest" && { buyerName: { fullName: customerInfo.name } }),
            ...(customerInfo?.email && customerInfo.email !== "Not Provided" && { buyerEmail: customerInfo.email })
        },
        settlementStrategy: { settlementCurrency: "USD" },
        env: { terminalType: "WEB" },
        paymentRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}`,
        paymentNotifyUrl: webhookUrl
    };

    const jsonBody = JSON.stringify(payload);
    const signature = generateSignature('POST', requestPath, clientId, requestTime, jsonBody, process.env.ANTOM_PRIVATE_KEY);
    const encodedSignature = encodeURIComponent(signature);
    const baseUrl = process.env.ANTOM_BASE_URL.replace(/\/$/, '');

    const response = await fetch(`${baseUrl}${requestPath}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Client-Id': clientId,
            'Request-Time': requestTime,
            'Signature': `algorithm=RSA256,keyVersion=1,signature=${encodedSignature}`
        },
        body: jsonBody
    });

    const result = await response.json();
    const checkoutUrl = result.paymentUrl || result.redirectUrl || result.normalUrl || result.paymentSessionData?.redirectUrl;

    if (!checkoutUrl) {
        throw new Error(result?.result?.resultMessage || "Antom payment session creation failed");
    }

    return {
        transactionId: result.paymentId || `ATOM_${Date.now()}`,
        checkoutUrl: checkoutUrl
    };
};

// --- The Strategy / Factory Function ---
export const processPaymentGateway = async (gatewayName, orderId, amount, customerInfo, packageDetails) => {
    switch (gatewayName.toUpperCase()) {
        case 'PAYPAL':
            return await generatePayPalSession(orderId, amount);
        case 'STRIPE':
            return await generateStripeSession(orderId, amount, customerInfo, packageDetails);
        case 'ATOM':
        case 'ANTOM':
            return await generateAntomSession(orderId, amount, customerInfo, packageDetails);
        default:
            throw new Error(`Payment gateway ${gatewayName} is not supported yet.`);
    }
};