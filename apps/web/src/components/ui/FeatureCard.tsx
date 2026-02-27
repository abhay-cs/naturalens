import React from "react";

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="flex flex-col p-8 rounded-[2rem] bg-wild-light transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-wild-dark shadow-sm mb-6 border border-black/5">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-wild-dark mb-4">{title}</h3>
            <p className="text-wild-gray leading-relaxed">{description}</p>
        </div>
    );
}
