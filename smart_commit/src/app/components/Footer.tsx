import { Terminal, Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Documentation", href: "#docs" },

    ],
    Company: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },

    ],
    Support: [
      { label: "Help Center", href: "#help" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },

    ],
  };

  const socialLinks = [

    { icon: Twitter, href: "#twitter", label: "Twitter" },
    { icon: Mail, href: "#email", label: "Email" },
  ];

  return (
    <footer className="bg-card border-t border-border px-6 sm:px-12 lg:px-24">
      <div className="container mx-auto py-16">
        {/* Main footer content */}
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Cmarta</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              AI-powered commit message generator for developers who want
              consistent, professional git history without the manual effort.
            </p>

            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-foreground mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 Cmarta. All rights reserved.
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground text-center md:text-right">
              <span>Made for developers, by developers</span>
              <div className="flex items-center space-x-1 justify-center sm:justify-end">
                <span>Built with</span>
                <span className="text-red-500">♥</span>
                <span>and AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
