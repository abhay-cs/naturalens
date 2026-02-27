import React from "react";
import { FeatureCard } from "../ui/FeatureCard";
import { Eye, Sparkles, Shield } from "lucide-react";

export function HowItWorksSection() {
    const features = [
        {
            icon: <Eye className="w-6 h-6" />,
            title: "Detect",
            description: "Real-time recognition through your camera or image uploads, working seamlessly in the field."
        },
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: "Identify",
            description: "Species, habitat, behavior — understood instantly with our advanced AI models."
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Protect",
            description: "Contribute to global conservation efforts through your daily observations."
        }
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 relative z-10 bg-[#FCFCFC]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-wild-dark tracking-tight mb-4">
                        How it works
                    </h2>
                    <p className="text-lg text-wild-gray">
                        Three simple steps to unlock the intelligence of nature
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <FeatureCard
                            key={idx}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
