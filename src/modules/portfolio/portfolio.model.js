import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: [
            'Web Development',
            'Mobile App',
            'UI/UX Design',
            'SEO Optimization',
            'Digital Marketing',
            'Cloud Solutions',
            'Business Automation',
            'IT Consulting',
            'AI Automation'
        ]
    },
    clientName: { type: String },
    technologies: [{ type: String, required: true }],
    thumbnailUrl: { type: String, required: true },
    projectUrl: { type: String },
    completionDate: { type: Date }
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;