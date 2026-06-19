// Static, presentational mock data for the ERP portal's enrichment screens.
// Themed around Solidigm (NAND/SSD manufacturer): SAP-style operational data
// (company/plant codes, material numbers) + Model-N-style channel pricing
// (gross-to-net, deals, rebates) — rendered in our own tgk-* design system,
// NOT a clone of either platform's UI.
//
// Loaded as a plain global before app.js. Keep RAW numbers here; app.js getters
// derive/format with the shared fmtMoney/fmtPct helpers.
//
// Data-reality note: order line items / linked docs are keyed by the EXISTING
// seed PO names (PO-10482 …) and reuse existing Docusign envelope/agreement
// names so they resolve against real records. New named entities (SKUs, OEM
// customers, distributor partners, deal/rebate IDs) are listed in the plan's
// manifest for the user to create matching Docusign records.

(function () {
  window.ERP_MOCK = Object.freeze({

    // ---- 1) Launchpad: grouped quick-launch tiles. `view` is the setView target. ----
    launchpadGroups: [
      {
        section: 'Operations',
        tiles: [
          { key: 'open-orders',  label: 'Open Orders',    value: '24',    trend: '+3 this week',     tone: 'sky',     view: 'orders' },
          { key: 'order-value',  label: 'Order Value',     value: '$4.8M', trend: '+5.1% QoQ',        tone: 'emerald', view: 'orders' },
          { key: 'vendors',      label: 'Active Vendors',  value: '4',     trend: 'All certified',    tone: 'amber',   view: 'vendors' }
        ]
      },
      {
        section: 'Procurement',
        tiles: [
          { key: 'open-deals',   label: 'Open Deals',      value: '3',     trend: '$9.7M pipeline',   tone: 'sky',     view: 'deals' },
          { key: 'approvals',    label: 'Pending Approvals', value: '5',   trend: 'Awaiting sign-off', tone: 'red',    view: 'invoices' }
        ]
      },
      {
        section: 'Revenue',
        tiles: [
          { key: 'gtn',          label: 'Gross-to-Net %',  value: '65.5%', trend: '+1.2 pts QoQ',     tone: 'emerald', view: 'grossToNet' },
          { key: 'rebates',      label: 'Rebate Accruals', value: '$426K', trend: '3 programs',       tone: 'amber',   view: 'deals' }
        ]
      }
    ],

    // ---- 2) Order object page: facets + line items + linked docs, keyed by PO name. ----
    orderFacets: { companyCode: 'SDGM1', plant: 'US-RC1', currency: 'USD' },

    // Material lines are semiconductor-authentic for an SSD maker. Per-PO sums
    // match the seed account values so the "Total Net" facet ties out.
    orderLineItemsByPo: {
      'PO-10482': [ // Atlas Components — Electronics
        { item: '00010', material: 'CTRL-PCIE5-G',  description: 'PCIe Gen5 SSD Controller',      qty: 400,   uom: 'EA', unitPrice: 22.00 },
        { item: '00020', material: 'DRAM-LP5-8G',   description: 'LPDDR5 DRAM, 8Gb',              qty: 600,   uom: 'EA', unitPrice: 6.00 }
      ],
      'PO-10455': [
        { item: '00010', material: 'CAP-ARR-0402',  description: 'SMD Capacitor Array, 0402',     qty: 20000, uom: 'EA', unitPrice: 0.18 },
        { item: '00020', material: 'CONN-U2-EDGE',  description: 'U.2 Edge Connector',            qty: 2000,  uom: 'EA', unitPrice: 2.50 }
      ],
      'PO-10460': [ // Pacific Freight — Logistics
        { item: '00010', material: 'FRT-OCEAN-40',  description: 'Ocean Freight, 40ft — Dalian→Oakland', qty: 2, uom: 'CTR', unitPrice: 7000.00 },
        { item: '00020', material: 'FRT-CUSTOMS',   description: 'Customs & Brokerage',           qty: 1,     uom: 'LOT', unitPrice: 4000.00 }
      ],
      'PO-10448': [
        { item: '00010', material: 'FRT-AIR-EXP',   description: 'Air Freight Expedite — wafer lots', qty: 1, uom: 'LOT', unitPrice: 14000.00 }
      ],
      'PO-10491': [ // Summit Materials — Raw Materials (wafers/substrate)
        { item: '00010', material: 'NAND-QLC-192L-W', description: '192-Layer QLC NAND Wafer Lot',  qty: 8,  uom: 'LOT', unitPrice: 6500.00 },
        { item: '00020', material: 'PCB-SUBSTR-U2',   description: 'U.2 PCB Substrate Panel',       qty: 1200, uom: 'EA', unitPrice: 10.00 }
      ],
      'PO-10470': [
        { item: '00010', material: 'NAND-QLC-192L-W', description: '192-Layer QLC NAND Wafer Lot',  qty: 3,  uom: 'LOT', unitPrice: 6500.00 },
        { item: '00020', material: 'PCB-SUBSTR-M2',   description: 'M.2 PCB Substrate Panel',       qty: 900, uom: 'EA', unitPrice: 5.00 }
      ],
      'PO-10502': [ // Vertex Packaging — Packaging
        { item: '00010', material: 'TRAY-JEDEC-M2', description: 'JEDEC Tray — M.2 2280',          qty: 5000,  uom: 'EA', unitPrice: 1.50 },
        { item: '00020', material: 'ESD-BAG-AS',    description: 'ESD Antistatic Bag — U.2',       qty: 12000, uom: 'EA', unitPrice: 0.50 }
      ],
      'PO-10488': [
        { item: '00010', material: 'LBL-RETAIL-P44', description: 'Retail Label & Insert — P44 Pro', qty: 7500, uom: 'EA', unitPrice: 1.00 }
      ]
    },

    // Linked-doc names reuse existing Docusign envelope/agreement records.
    orderLinkedDocsByPo: {
      'PO-10482': [
        { name: 'Atlas Components — Master Supply Agreement', type: 'Agreement', status: 'completed' },
        { name: 'Invoice INV-2047 — Atlas Components',        type: 'Invoice',   status: 'sent' }
      ],
      'PO-10455': [
        { name: 'Atlas Components — Master Supply Agreement', type: 'Agreement', status: 'completed' }
      ],
      'PO-10460': [
        { name: 'Pacific Freight — Quality Certification',    type: 'Certificate', status: 'completed' }
      ],
      'PO-10448': [
        { name: 'Pacific Freight — Quality Certification',    type: 'Certificate', status: 'completed' }
      ],
      'PO-10491': [
        { name: 'Purchase Order PO-10491 — Summit Materials', type: 'Purchase Order', status: 'delivered' }
      ],
      'PO-10470': [
        { name: 'Purchase Order PO-10491 — Summit Materials', type: 'Purchase Order', status: 'delivered' }
      ],
      'PO-10502': [
        { name: 'Vertex Packaging — Delivery Receipt',        type: 'Receipt',   status: 'completed' }
      ],
      'PO-10488': [
        { name: 'Vertex Packaging — Delivery Receipt',        type: 'Receipt',   status: 'completed' }
      ]
    },

    // ---- 3) Gross-to-Net bridge (semiconductor channel flavor). ----
    // First step = base (gross), middle = deductions (negative), last = net.
    grossToNet: {
      currency: 'USD',
      period: 'Q2 FY26',
      steps: [
        { key: 'gross',    label: 'List / Gross Sales',           kind: 'base',      amount:  48500000 },
        { key: 'distdisc', label: 'Distributor Discount',         kind: 'deduction', amount:  -6305000 },
        { key: 'shipdebit',label: 'Ship-and-Debit',               kind: 'deduction', amount:  -4365000 },
        { key: 'rebates',  label: 'Volume Rebates',               kind: 'deduction', amount:  -2910000 },
        { key: 'priceprot',label: 'Price Protection',             kind: 'deduction', amount:  -1455000 },
        { key: 'mdf',      label: 'Market Development Funds (MDF)', kind: 'deduction', amount:  -970000 },
        { key: 'returns',  label: 'Returns / RMA & Stock Rotation', kind: 'deduction', amount: -727500 },
        { key: 'net',      label: 'Net Sales',                    kind: 'net',       amount:  31767500 }
      ]
    },

    // ---- 4) Deals & Rebates ----
    deals: [
      {
        id: 'DEAL-3092', customer: 'Dell Technologies', value: 1840000, status: 'review', score: 82,
        lineItems: [
          { sku: 'D7-P5520-3.84TB',    list: 540,  qty: 2400, discountPct: 18, marginPct: 31 },
          { sku: 'D5-P5336-61.44TB',   list: 4200, qty: 200,  discountPct: 12, marginPct: 27 }
        ],
        approvals: [
          { step: 'Regional Sales Director', status: 'completed' },
          { step: 'Deal Desk / Pricing',     status: 'review' },
          { step: 'VP Finance',              status: 'pending' }
        ]
      },
      {
        id: 'DEAL-3105', customer: 'Supermicro', value: 2650000, status: 'completed', score: 88,
        lineItems: [
          { sku: 'D7-PS1010-7.68TB',   list: 1180, qty: 1500, discountPct: 15, marginPct: 34 },
          { sku: 'D5-P5430-15.36TB',   list: 1650, qty: 600,  discountPct: 10, marginPct: 29 }
        ],
        approvals: [
          { step: 'Regional Sales Director', status: 'completed' },
          { step: 'Deal Desk / Pricing',     status: 'completed' },
          { step: 'VP Finance',              status: 'completed' }
        ]
      },
      {
        id: 'DEAL-3118', customer: 'Cloud — Project Aurora', value: 5200000, status: 'pending', score: 74,
        lineItems: [
          { sku: 'D5-P5336-61.44TB',   list: 4200, qty: 1000, discountPct: 22, marginPct: 24 },
          { sku: 'D7-PS1010-7.68TB',   list: 1180, qty: 800,  discountPct: 20, marginPct: 26 }
        ],
        approvals: [
          { step: 'Regional Sales Director', status: 'completed' },
          { step: 'Deal Desk / Pricing',     status: 'review' },
          { step: 'VP Finance',              status: 'pending' }
        ]
      }
    ],

    rebatePrograms: [
      { id: 'RBT-1180', partner: 'TD Synnex',         type: 'Volume Incentive', targetVol: 500000, actualVol: 412000, accrued: 188000, paid: 120000, status: 'active' },
      { id: 'RBT-1206', partner: 'Ingram Micro',      type: 'Growth Rebate',    targetVol: 300000, actualVol: 318000, accrued: 142500, paid: 142500, status: 'completed' },
      { id: 'RBT-1233', partner: 'Arrow Electronics', type: 'Ship-and-Debit',   targetVol: 250000, actualVol: 168000, accrued: 96000,  paid: 40000,  status: 'active' }
    ]
  });
})();
