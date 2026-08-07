"use client";

import React from "react";
import { motion } from "framer-motion";

export function ProductMockup() {
    const barcodeWidths = [
        2, 1, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 1,
        2, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2
    ];

    return (
        <section className="px-6 pb-32 flex justify-center">
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[600px]"
            >
                {/* The ID Card Container */}
                <div className="relative w-full aspect-[1.58] rounded-[16px] bg-[#fcfbfa] border-2 border-gray-300 shadow-2xl overflow-hidden flex flex-col font-sans text-black select-none">

                    {/* Left Blue Bar - only upper left */}
                    <div className="absolute top-0 left-0 w-[35%] h-[63%] bg-[#40689b] z-0" />

                    {/* Wild Environment SVG Background (spans across card) */}
                    <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden opacity-90 pointer-events-none">
                        <svg className="absolute w-full h-full" viewBox="0 0 600 380" preserveAspectRatio="none">
                            {/* Straight Angled Bands */}
                            <path d="M -50 160 L 650 300" fill="none" stroke="#2c5e3b" strokeWidth="20" />
                            <path d="M -50 178 L 650 318" fill="none" stroke="#4a7c59" strokeWidth="20" />
                            <path d="M -50 196 L 650 336" fill="none" stroke="#729b79" strokeWidth="20" />
                            <path d="M -50 214 L 650 354" fill="none" stroke="#a08b6c" strokeWidth="20" />
                            <path d="M -50 232 L 650 372" fill="none" stroke="#cfa668" strokeWidth="20" />
                        </svg>
                    </div>

                    {/* Top Half Area */}
                    <div className="relative z-10 flex w-full h-[63%]">
                        {/* Left Column (Photo) */}
                        <div className="w-[35%] h-full flex flex-col items-center justify-center pt-8 px-4">
                            <div className="w-full max-w-[130px] aspect-[4/5] bg-[url('https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center rounded-[3px] shadow-[2px_2px_10px_rgba(0,0,0,0.3)] border border-black/10 mix-blend-normal" />
                        </div>

                        {/* Right Column (Header & Top Data) */}
                        <div className="flex-1 h-full pt-4 pr-6 pl-2 flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <h2
                                        className="text-[2.5rem] text-[#2c61aa] tracking-tighter leading-none m-0"
                                        style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", WebkitTextStroke: "1px #113665", textShadow: "2px 2px 0px #113665" }}
                                    >
                                        NATURALENS
                                    </h2>
                                    <span className="text-[#2c61aa] font-semibold text-xs tracking-tighter uppercase leading-[1.1] mt-1 ml-1" style={{ fontFamily: "Arial, sans-serif" }}>
                                        Species<br />License
                                    </span>
                                </div>
                            </div>

                            {/* Number */}
                            <div className="flex items-center gap-4 mt-2 mb-4">
                                <span className="text-[12px] font-bold text-black uppercase tracking-wide">Number</span>
                                <span className="text-2xl font-bold text-black tracking-widest font-sans" style={{ fontFamily: "Arial, sans-serif", fontWeight: 900 }}>01-47-87441</span>
                            </div>

                            {/* Data Row 1 (DOB & EXP) superimposed on rainbow */}
                            <div className="mt-2 flex gap-8 items-center font-bold text-[12px] leading-none tracking-tight">
                                <div className="flex gap-2 items-center">
                                    <span className="text-[#104e1f] text-[15px]">DOB</span>
                                    <span className="text-[1.4rem] leading-none text-black tracking-tighter">06/03/2018</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-[#842c1d] text-[15px]">EXP</span>
                                    <span className="text-[1.4rem] leading-none text-black tracking-tighter">06/03/2030</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Half Area */}
                    <div className="relative z-10 flex w-full h-[37%] mt-1">
                        {/* Bottom Left (Barcode & Address) */}
                        <div className="w-[35%] h-full flex flex-col px-3 pt-0">
                            {/* Barcode */}
                            <div className="flex h-10 mb-2 items-start gap-[1.5px] w-full overflow-hidden bg-white/40 mix-blend-multiply">
                                {barcodeWidths.map((w, i) => (
                                    <div key={i} className="bg-black shrink-0" style={{ width: `${w}px`, height: i % 4 === 0 || i % 7 === 0 ? '100%' : '80%' }} />
                                ))}
                            </div>
                            <span className="font-bold text-xs uppercase leading-tight font-sans tracking-wide">Giant Panda</span>
                            <span className="text-[10px] font-bold leading-tight uppercase font-sans tracking-wide">Ailuropoda Melanoleuca</span>
                            <span className="text-[10px] font-bold leading-tight uppercase font-sans tracking-wide mt-1">Sichuan, China</span>
                        </div>

                        {/* Bottom Right (More Data & Signature) */}
                        <div className="flex-1 h-full pl-2 pr-6 flex flex-col font-sans">
                            {/* Data Row 2 */}
                            <div className="flex justify-between text-[#852554] font-bold text-[10px] uppercase pr-2 w-full tracking-tighter mt-1 mix-blend-color-burn">
                                <div className="flex flex-col items-center"><span>HT</span><span className="text-black/80 font-bold">75cm</span></div>
                                <div className="flex flex-col items-center"><span>WT</span><span className="text-black/80 font-bold">100kg</span></div>
                                <div className="flex flex-col items-center"><span>COAT</span><span className="text-black/80 font-bold">B/W</span></div>
                                <div className="flex flex-col items-center"><span>EYES</span><span className="text-black/80 font-bold">BRO</span></div>
                                <div className="flex flex-col items-center"><span>SEX</span><span className="text-black/80 font-bold">M</span></div>
                                <div className="flex flex-col items-center"><span>CTY</span><span className="text-black/80 font-bold">0</span></div>
                            </div>

                            {/* Data Row 3 */}
                            <div className="flex gap-4 text-black font-bold text-[10px] uppercase mt-1 tracking-tighter pl-1">
                                <div className="flex flex-col items-start gap-1 w-20"><span>ISSUE DATE</span><span className="text-black/80 font-bold text-[11px]">06/18/2023</span></div>
                                <div className="flex flex-col items-center gap-1 w-12"><span>CLASS</span><span className="text-black/80 font-bold">3</span></div>
                                <div className="flex flex-col items-center gap-1 w-12"><span>RESTR</span></div>
                                <div className="flex flex-col items-center gap-1 w-16"><span>ENDORSE</span></div>
                            </div>

                            {/* Signature */}
                            <div className="flex justify-center flex-1 items-end pb-3 pr-10">
                                {/* Fake Signature Name */}
                                <svg className="w-32 h-10 -rotate-2 mix-blend-multiply opacity-80" viewBox="0 0 200 60">
                                    {/* Red Panda cursive-ish signature path */}
                                    <path d="M 20 40 Q 30 10 40 30 T 60 40 Q 80 20 90 40 T 120 20 Q 140 50 160 30 T 180 50" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M 35 25 Q 50 25 65 25" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </section>
    );
}
