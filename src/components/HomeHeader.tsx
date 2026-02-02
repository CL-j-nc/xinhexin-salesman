import React from "react";

/**
 * HomeHeader - 首页专用 Header（背景图 + 叠加两行标题）
 */
const HomeHeader: React.FC = () => {
  return (
    <header className="w-full relative home-header">
      <img
        src="/head-background.png"
        alt="首页头图"
        className="w-full h-auto block"
        loading="eager"
      />
      <div
        className="absolute pointer-events-none home-header-title-wrap"
        style={{
          left: "47%",
          top: "19%",
        }}
      >
        <div className="home-header-title-stack text-left">
          <div className="home-header-title">新核心车险承保系统</div>
          <div className="home-header-subtitle">
            SHIE上海保交所车险好投保平台专属渠道支持
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
