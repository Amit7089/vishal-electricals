
import { Link } from "react-router-dom";
import {
  Zap,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";

const categories = [
  { name: "LED Lights", path: "/shop?category=LED%20Lights" },
  { name: "Fans", path: "/shop?category=Fans" },
  { name: "Wires & Cables", path: "/shop?category=Wires%20%26%20Cables" },
  { name: "Switches", path: "/shop?category=Switches" },
  { name: "Coolers", path: "/shop?category=Coolers" },
  { name: "Home Appliances", path: "/shop?category=Home%20Appliances" },
];

const quickLinks = [
  { name: "Home", path: "/" },
  { name: "Shop All Products", path: "/shop" },
  { name: "Shopping Cart", path: "/cart" },
  { name: "My Account", path: "/login" },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <Zap size={23} fill="currentColor" />
              </span>

              <span>
                <span className="block text-lg font-extrabold text-white">
                  Vishal Electricals
                </span>
                <span className="text-[9px] font-semibold tracking-[0.18em] text-orange-400">
                  POWERING YOUR WORLD
                </span>
              </span>
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
              Electrical essentials, LED lights, fans, wires,
              switches and home appliances — all in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white">
              Quick Links
            </h3>

            <ul className="mt-3 space-y-2">
              {quickLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-sm text-slate-400 transition hover:text-orange-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-white">
              Popular Categories
            </h3>

            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {categories.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-sm text-slate-400 transition hover:text-orange-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-white">
              Contact Us
            </h3>

            <p className="mt-3 text-sm leading-5 text-slate-400">
              Need help with a product or order? Contact our store.
            </p>

            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-orange-400"
                />
                <p className="text-sm text-slate-400">
                  Visit our store for electrical essentials.
                </p>
              </div>

              <a
                href="tel:8349665141"
                className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-orange-400"
              >
                <Phone size={16} className="shrink-0 text-orange-400" />
                8349665141
              </a>

              <a
                href="mailto:support@vishalelectricals.com"
                className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-orange-400"
              >
                <Mail size={16} className="shrink-0 text-orange-400" />
                Email Support
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Vishal Electricals. All rights reserved.
          </p>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-orange-400" />
            Shop with confidence
          </p>
        </div>
      </div>
    </footer>
  );
}
