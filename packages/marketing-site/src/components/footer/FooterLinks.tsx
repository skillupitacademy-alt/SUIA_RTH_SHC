
import React from 'react';
import { QUICK_LINKS } from '@quiz/marketing-site/lib/FooterData';

const FooterLinks: React.FC = () => {
    return (
        <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900">
                Quick Links
            </h3>

            <ul className="space-y-2">
                {QUICK_LINKS.map((link, index) => (
                    <li key={index}>
                        <a
                            href="#"
                            className="group flex items-center gap-2 text-black transition-colors duration-500 hover:text-blue-600 transition-translate duration-500"
                        >
                            <span className="text-lg font-bold transition-transform group-hover:translate-x-1">
                                ›
                            </span>
                            <span className='transition-translate duration-500 group-hover:translate-x-1'>{link.label}</span>
                        </a>

                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FooterLinks;
