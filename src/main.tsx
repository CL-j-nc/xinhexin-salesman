import React from "react";

const HomeHeader: React.FC = () => {
    return (
        <header>
            <div
                className="w-full relative overflow-hidden"
                style={{
                    backgroundImage: "url(/logo-background.png)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "top center",
                    aspectRatio: "1920 / 420"
                }}
            >
                <div
                    className="absolute"
                    style={{
                        left: "8%",
                        top: "22%"
                    }}
                >
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo-a.png"
                            alt="China Life"
                            className="h-[14%] max-h-[56px] object-contain"
                        />
                        <div className="flex flex-col">
                            <span
                                className="xh-title"
                                style={{
                                    fontFamily: "kailasa",
                                    fontWeight: "bold",
                                    color: "#4E9E72"
                                }}
                            >
                                新核心车险承保系统
                            </span>
                            <span
                                className="xh-subtitle"
                                style={{
                                    fontFamily: "kailasa",
                                    fontWeight: "bold",
                                    color: "#0A1753"
                                }}
                            >
                                SHIE上海保交所车险好投保平台专属渠道支持
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HomeHeader;
