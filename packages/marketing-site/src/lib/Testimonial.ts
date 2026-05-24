export interface Testimonial {
    id: number;
    initial: string;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    highlight?: string;
    specialBg?: string;
    specialText?: string;
}

const NEXT_CARD = (id: number, specialBg: string): Testimonial => ({
    id,
    initial: '🚀',
    name: 'You Are Next!',
    role: 'Your Dream Role',
    company: 'Your Dream Company',
    content: 'Join our comprehensive training programs and transform your career. Let us help you become the next big success story in the tech industry. Your journey starts here!',
    rating: 5,
    highlight: 'Your Success Story Awaits',
    specialBg,
    specialText: 'text-white'
});

export const TESTIMONIALS_DATA: Testimonial[] = [
    NEXT_CARD(100, 'bg-blue-600'), // FIRST
    {
        id: 1,
        initial: 'R',
        name: 'Raj Mhatre',
        role: 'Full Stack Developer',
        company: 'Zimozi',
        content: 'The Full Stack curriculum perfectly bridged the gap between theory and real-world application. I was able to secure a 7 LPA package because of the comprehensive MERN stack training and hands-on projects.',
        rating: 5,
        highlight: 'Secured 7 LPA package'
    },
    {
        id: 2,
        initial: 'A',
        name: 'Ajinkya Bansode',
        role: 'Full Stack Developer',
        company: 'Apprication',
        content: 'The mentorship and live coding sessions were incredible. I built a strong portfolio of web applications that helped me clear my technical rounds at Apprication with ease.',
        rating: 5,
        highlight: 'Placed as Full Stack Developer'
    },
    {
        id: 3,
        initial: 'K',
        name: 'Kaushik Sharma',
        role: 'Front End Developer',
        company: 'Marketinf Space Pvt Ltd.',
        content: 'Learning advanced React and modern CSS frameworks transformed how I approach UI development. Thrilled to start my journey with a 3.60 LPA package!',
        rating: 5,
        highlight: 'Mastered Advanced React UI'
    },
    {
        id: 4,
        initial: 'P',
        name: 'Priyam Kuvad',
        role: 'Data Scientist',
        company: 'Mondelez International',
        content: 'The Data Science track was rigorous and highly practical. From Python fundamentals to Machine Learning algorithms, it gave me exactly what I needed to land a 4.80 LPA role at a top global company.',
        rating: 5,
        highlight: '4.80 LPA at Mondelez International'
    },
    {
        id: 5,
        initial: 'R',
        name: 'Radhey Ambre',
        role: 'Front End Developer',
        company: 'Rechlocal Services Pvt. Ltd.',
        content: 'The frontend projects were exactly what the industry demands right now. The continuous feedback on my code structure was the key to cracking my interviews.',
        rating: 5,
        highlight: 'Industry-ready portfolio'
    },
    {
        id: 6,
        initial: 'S',
        name: 'Siddesh More',
        role: 'Front End Developer',
        company: 'WDIPL.com',
        content: 'I went from struggling with basic JavaScript to building complex React applications. The instructors truly care about your success. Very happy with my 3 LPA placement.',
        rating: 5,
        highlight: 'From basics to complex React'
    },
    {
        id: 7,
        initial: 'U',
        name: 'Utkarsh Chaudhari',
        role: '.Net Developer',
        company: 'HR Mantra',
        content: 'The comprehensive backend training in C# and .Net architecture gave me the confidence to handle enterprise-level codebases. A great starting point for my career.',
        rating: 5,
        highlight: 'Mastered .Net Architecture'
    },
    {
        id: 8,
        initial: 'A',
        name: 'Atul Kite',
        role: 'Data Analyst',
        company: 'The Byke Hospitality Ltd.',
        content: 'Learning SQL, Excel, and Power BI through real business case studies was a game changer. I use these skills every day in my current role to drive business decisions.',
        rating: 5,
        highlight: 'Real business case studies'
    },
    {
        id: 9,
        initial: 'G',
        name: 'Gauri Chaurasia',
        role: 'Data Analyst',
        company: 'Dalal And Broacha Stock Broking',
        content: 'The financial dataset projects were phenomenal. I now seamlessly analyze massive market datasets for a top stock broking firm with a 3.00 LPA package.',
        rating: 5,
        highlight: 'Cracked role in Stock Broking'
    },
    NEXT_CARD(101, 'bg-orange-500'), // IN BETWEEN
    {
        id: 10,
        initial: 'B',
        name: 'Bhavani',
        role: 'Front End Developer',
        company: 'TechnoPoint',
        content: 'The dedicated placement support and mock interviews prepared me perfectly for my role at TechnoPoint. The course is extremely beginner-friendly but highly advanced.',
        rating: 5,
        highlight: 'Excellent placement support'
    },
    {
        id: 11,
        initial: 'Z',
        name: 'Zahid Sheikh',
        role: 'Front End Developer',
        company: 'TechnoPoint',
        content: 'Building responsive web pages from scratch taught me so much. The curriculum is perfectly tailored to what modern tech companies are actively hiring for.',
        rating: 5,
        highlight: 'Modern tech stack mastery'
    },
    {
        id: 12,
        initial: 'P',
        name: 'Prajesh',
        role: 'Data Analyst',
        company: 'Sarjak Container Line Pvt. Ltd.',
        content: 'The focus on practical data visualization and dashboard creation helped me secure my 3.00 LPA role in the logistics sector. Highly recommend this program!',
        rating: 5,
        highlight: 'Secured logistics data role'
    },
    {
        id: 13,
        initial: 'R',
        name: 'Rakesh Ghargawe',
        role: 'Full Stack Developer',
        company: 'Brainworx Infovision',
        content: 'Learning how to deploy full-stack applications to the cloud gave me a massive edge in interviews. Proud to have secured a 3.00 LPA package.',
        rating: 5,
        highlight: 'Cloud deployment skills'
    },
    {
        id: 14,
        initial: 'A',
        name: 'Abhishek Yadav',
        role: 'Front End Developer',
        company: 'TechnoPoint',
        content: 'The rigorous front-end syllabus and continuous assignments kept me on track. Grateful for the support that helped me kickstart my career in tech.',
        rating: 5,
        highlight: 'Kickstarted tech career'
    },
    {
        id: 15,
        initial: 'A',
        name: 'Amit Yadav',
        role: 'Front End Intern',
        company: 'Sigmoid Frogs',
        content: 'The fast-paced learning environment helped me land a great internship right out of the bootcamp. The skills I learned are directly applicable to my daily tasks.',
        rating: 5,
        highlight: 'Secured Top Internship'
    },
    {
        id: 16,
        initial: 'H',
        name: 'Himanshu Singh',
        role: 'Front End Intern',
        company: 'Sigmoid Frogs',
        content: 'Thanks to the in-depth CSS and JavaScript modules, I was able to crack my internship interview on the first try. The learning experience was amazing.',
        rating: 5,
        highlight: 'Cracked interview on first try'
    },
    {
        id: 17,
        initial: 'K',
        name: 'Kshitija Gaikar',
        role: 'Front End Developer',
        company: 'TechnoPoint',
        content: 'The personalized guidance and structured front-end modules were exactly what I needed to build my skills and secure my 1.80 LPA position.',
        rating: 5,
        highlight: 'Personalized guidance'
    },
    {
        id: 18,
        initial: 'P',
        name: 'Prathmesh Yadav',
        role: 'SQL Developer',
        company: 'Pharmizza Infotech Pvt Ltd',
        content: 'The database optimization and complex query writing sessions were brilliant. They helped me directly crack my technical interview for a SQL Developer role.',
        rating: 5,
        highlight: 'Secured SQL Developer role'
    },
    {
        id: 19,
        initial: 'A',
        name: 'Anand Upadhyay',
        role: 'Data Analyst',
        company: 'Dalal And Broacha Stock Broking Pvt. Ltd.',
        content: 'The structured approach to data analysis with real financial datasets was exceptional. The training gave me the confidence to step into a stock broking firm and deliver results from day one.',
        rating: 5,
        highlight: 'Placed in Stock Broking'
    },
    {
        id: 20,
        initial: 'S',
        name: 'Shubham Singh',
        role: 'Digital Content Management Analyst',
        company: 'Apogee Services Pvt Ltd',
        content: 'The course gave me a strong foundation in content strategy and digital tools. The structured curriculum and hands-on assignments helped me land a 3 LPA role at Apogee Services. Highly recommend to anyone looking to break into digital roles.',
        rating: 5,
        highlight: 'Secured 3 LPA package'
    },
    NEXT_CARD(102, 'bg-[#0A192F]') // LAST
];

// Configuration for the section
export const TESTIMONIAL_CONFIG = {
    title: 'What Student Say',
    description: 'Hear from successful alumni who transformed their careers with our programs',
};