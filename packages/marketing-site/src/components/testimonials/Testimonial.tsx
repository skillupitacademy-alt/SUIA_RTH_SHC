

import React from 'react';
import TestimonialGrid from './TestimonialGrid';
import { TESTIMONIALS_DATA, TESTIMONIAL_CONFIG } from '@quiz/marketing-site/lib/Testimonial';
import { SectionHeader } from '../CommonHeader/SectionHeader';


const Testimonial: React.FC = () => {
    return (
        <section id='testimonials' className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="mt-10 max-w-7xl mx-auto">
                <SectionHeader title={TESTIMONIAL_CONFIG.title} description={TESTIMONIAL_CONFIG.description} />
                <TestimonialGrid testimonials={TESTIMONIALS_DATA} />
            </div>
        </section>
    );
};

export default Testimonial;