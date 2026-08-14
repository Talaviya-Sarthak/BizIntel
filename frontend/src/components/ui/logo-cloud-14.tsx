import { ArrowUpRight } from "lucide-react";
import {
  Logo01,
  Logo02,
  Logo03,
  Logo04,
  Logo05,
  Logo06,
  Logo07,
  Logo08,
} from "@/components/ui/logo-cloud-14-utils/logos";
import { Button } from "@/components/ui/Button";

const logos = [
  Logo01,
  Logo02,
  Logo03,
  Logo04,
  Logo05,
  Logo06,
  Logo07,
  Logo08,
  Logo01,
];

const LogoCloud = () => {
  return (
    <section className="relative py-10 sm:py-14 border-t border-zinc-800/80">
      <div className="container-shell">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <div className="flex flex-col rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-6 max-sm:col-span-full sm:row-span-3 backdrop-blur-md shadow-lg">
            <p className="mb-8 max-w-[20ch] text-balance font-bold text-2xl tracking-tight sm:text-xl lg:text-2xl text-zinc-100">
              Trusted by teams and companies around the world
            </p>

            <Button className="mt-auto max-sm:me-auto bg-white text-zinc-950 font-semibold hover:bg-zinc-200 rounded-xl transition-all duration-200 shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-1.5" size="lg">
              View companies <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          {logos.map((Logo, index) => (
            <div
              className="flex w-full items-center justify-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 px-3 py-7 backdrop-blur-md transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/80 hover:-translate-y-0.5 shadow-sm"
              key={index}
            >
              <Logo className="h-7 sm:h-8" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoCloud;
export { LogoCloud };
