export interface Startup {
    id: string;
    slug: string;
    name: string;
    industry: string;
    city: string;
    tagline: string;
    mission: string;
    viksitBharatContribution: string;
    website: string;
    logoUrl?: string;
    coverUrl?: string;
}

export const startups: Startup[] = [
    {
        id: "1",
        slug: "3eco",
        name: "3eco Systems",
        industry: "Electric Mobility",
        city: "Bengaluru",
        tagline: "Accelerating India's electric mobility ecosystem.",
        mission: "To provide comprehensive, technology-driven electric vehicle solutions that make sustainable transportation accessible and efficient for businesses across India.",
        viksitBharatContribution: "By enabling electric mobility infrastructure at scale, 3eco is helping India transition towards sustainable transportation, reducing carbon emissions, and directly contributing to the vision of an energy-independent Viksit Bharat 2047.",
        website: "https://3eco.in",
        logoUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=150&h=150",
        coverUrl: "https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?auto=format&fit=crop&q=80&w=1200&h=400",
    },
    {
        id: "2",
        slug: "kisaan-connect",
        name: "Kisaan Connect",
        industry: "AgriTech",
        city: "Pune",
        tagline: "Empowering farmers with AI-driven yield optimization.",
        mission: "To bridge the technology gap in Indian agriculture by providing farmers with accessible, real-time data on soil health, weather, and market prices.",
        viksitBharatContribution: "Agriculture is the backbone of India. By increasing crop yields and ensuring fair pricing for farmers through digital inclusion, Kisaan Connect is driving rural prosperity and food security for Viksit Bharat 2047.",
        website: "#",
        logoUrl: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&q=80&w=150&h=150",
        coverUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200&h=400",
    },
    {
        id: "3",
        slug: "aero-def",
        name: "AeroDef Dynamics",
        industry: "Defense Tech",
        city: "Hyderabad",
        tagline: "Building indigenous drone technology for border security.",
        mission: "To design and manufacture advanced UAVs and surveillance systems locally, reducing import dependency and strengthening national security.",
        viksitBharatContribution: "Supporting the 'Aatmanirbhar Bharat' initiative, AeroDef is creating cutting-edge defense technologies domestically, ensuring India's self-reliance in defense manufacturing by 2047.",
        website: "#",
        logoUrl: "https://images.unsplash.com/photo-1524143878510-d3b87cfaf485?auto=format&fit=crop&q=80&w=150&h=150",
        coverUrl: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=1200&h=400",
    },
    {
        id: "4",
        slug: "medisync",
        name: "MediSync",
        industry: "HealthTech",
        city: "Mumbai",
        tagline: "Unified health records for the next billion Indians.",
        mission: "To create a seamless, secure, and interoperable digital health ecosystem that connects patients, doctors, and pharmacies.",
        viksitBharatContribution: "By digitizing healthcare access and integrating with the Ayushman Bharat Digital Mission, MediSync is ensuring that quality healthcare is accessible to every Indian, a core pillar of Viksit Bharat 2047.",
        website: "#",
        logoUrl: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=150&h=150",
        coverUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200&h=400",
    }
];
