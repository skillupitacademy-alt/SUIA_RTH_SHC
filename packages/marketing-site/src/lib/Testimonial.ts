export interface Testimonial {
    id: number;
    initial: string;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    highlight?: string;
}


export const TESTIMONIALS_DATA: Testimonial[] = [
    {
        id: 1,
        initial: 'A',
        name: 'Aarav S.',
        role: 'Frontend Developer',
        company: 'Pinty',
        content: 'The Full-Stack track was hands-on and mentor support was great. Landed a job in 2 months.',
        rating: 5,
        highlight: 'Landed job in 2 months',
    },
    {
        id: 2,
        initial: 'P',
        name: 'Priya S.',
        role: 'Data Scientist',
        company: 'TechCorp',
        content: 'The Data Science course gave me the practical skills I needed to transition into a data role. The projects were industry-relevant and the mentorship was exceptional.',
        rating: 5,
        highlight: 'Career transition successful',
    },
    {
        id: 3,
        initial: 'M',
        name: 'Michael R.',
        role: 'Backend Engineer',
        company: 'CloudSys',
        content: 'The curriculum was perfectly paced with real-world projects. Got multiple offers within 6 weeks of completion.',
        rating: 5,
        highlight: 'Multiple offers in 6 weeks',
    },
];

// Configuration for the section
export const TESTIMONIAL_CONFIG = {
    title: 'What Student Say',
    description: 'Hear from successful alumni who transformed their careers with our programs',
};