
import FooterBrand from './FooterBrand';
import FooterLinks from './FooterLinks';
import FooterCourse from './FooterCourse';
import FooterContact from './FooterContact';
import FooterLegal from './FooterLegal';
import FooterBottom from './FooterBottom';

const Footer = () => {
  return (
    <footer className="bg-transparent border-t border-gray-200 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Grid - Brand, Links, Courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <FooterBrand />
          <FooterLinks />
          <FooterCourse />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-6"></div>

        {/* Middle Grid - Contact & Legal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Contact Info - Will go here */}
          <div className="lg:col-span-2">
            <FooterContact />
          </div>

          <div>
            <FooterLegal />
          </div>
        </div>

        {/* Bottom Section */}
        <div>
          <FooterBottom />
        </div>

      </div>
    </footer>
  );
};

export default Footer;