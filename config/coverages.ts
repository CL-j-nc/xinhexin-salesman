// config/coverages.ts
// 投保端险种配置（不含费率、不含核保规则）

export enum CoverageGroup {
  DAMAGE = 'DAMAGE',
  THIRD_PARTY = 'THIRD_PARTY',
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER'
}

export const MAIN_COVERAGES = {
  FUEL: [
    { id: 'damage', name: '车辆损失保险', group: CoverageGroup.DAMAGE, levels: ['按新车购置价'] },
    { id: 'third_party', name: '第三者责任保险', group: CoverageGroup.THIRD_PARTY, levels: ['100万', '200万', '300万'] },
    { id: 'driver', name: '车上人员责任保险-驾驶员', group: CoverageGroup.DRIVER, levels: ['1万', '5万', '10万'] },
    { id: 'passenger', name: '车上人员责任保险-乘客', group: CoverageGroup.PASSENGER, levels: ['1万', '5万', '10万'] }
  ],
  NEV: [
    { id: 'damage', name: '新能源汽车损失保险', group: CoverageGroup.DAMAGE, levels: ['按新车购置价'] },
    { id: 'third_party', name: '新能源汽车第三者责任保险', group: CoverageGroup.THIRD_PARTY, levels: ['100万', '200万', '300万'] },
    { id: 'driver', name: '新能源汽车车上人员责任保险-驾驶员', group: CoverageGroup.DRIVER, levels: ['1万', '5万', '10万'] },
    { id: 'passenger', name: '新能源汽车车上人员责任保险-乘客', group: CoverageGroup.PASSENGER, levels: ['1万', '5万', '10万'] }
  ]
} as const;

export const NEV_ADDONS = [
  {
    id: 'NEV_GRID_FAILURE',
    name: '附加外部电网故障损失险',
    selectable: true
  },
  {
    id: 'NEV_ROAD_ASSIST',
    name: '新能源汽车道路救援服务特约条款',
    selectable: false
  },
  {
    id: 'NEV_INSPECTION',
    name: '附加新能源汽车代位送检服务特约条款',
    selectable: false
  }
];
