import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        isIncluded: { type: Boolean, default: true },
        tooltip: { type: String, default: '' }
    });

const PackageSchema = new mongoose.Schema({
    tier: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    price: { type: Number, required: true },
    deliveryDays: { type: Number, required: true },
    revisions: { type: String, default: '3' },
    isPopular: { type: Boolean, default: false },
    features: [FeatureSchema]
});

const ServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    categoryIcon: { type: String, required: true },
    shortDescription: { type: String, required: true },
    packages: [PackageSchema]
},
    { timestamps: true },
    { versionKey: false }
);

const Service = mongoose.model('Service', ServiceSchema);
export default Service;