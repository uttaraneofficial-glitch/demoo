const MOCK_TEASER_DATA = {
    marketDemand: {
        score: 85,
        drivers: ['High demand in local area', 'Growing industry trend'],
        sources: ['Google Trends', 'Local Search Data'],
        growthIndex: 'Very High',
        marketSaturation: 'Low',
        marketSummary: 'There is a strong opportunity here. The market is showing significant growth signals with low local saturation.'
    },
    competitors: [
        { name: 'Hidden Competitor A', location: 'Nearby', stage: 'Established', description: 'Major player in the area.', threatLevel: 'High' },
        { name: 'Hidden Competitor B', location: 'Nearby', stage: 'Startup', description: 'Emerging competitor.', threatLevel: 'Medium' }
    ],
    risks: [
        { title: 'Regulatory Compliance', description: 'Local laws may require specific permits.', severity: 'Medium', mitigation: 'Consult local authorities.' },
        { title: 'Supply Chain', description: 'Potential delays in sourcing materials.', severity: 'Low', mitigation: 'Diversify suppliers.' }
    ],
    demographics: {
        targetAge: '25-45',
        incomeLevel: 'Middle to High',
        actualNeed: ['Convenience', 'Quality', 'Speed'],
        verdict: 'Strong match for target demographic.'
    },
    actionPlan: [
        { range: 'Day 1-30', tasks: ['Market validation', 'Setup basic operations', 'Initial marketing push'] },
        { range: 'Day 31-60', tasks: ['Scale operations', 'Partnership outreach', 'Optimize based on feedback'] },
        { range: 'Day 61-90', tasks: ['Full launch', 'Expand marketing channels', 'Evaluate unit economics'] }
    ]
};
