import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 lg:px-8 text-center animate-in fade-in zoom-in duration-700">

      {/* Hero Section */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 mb-6 drop-shadow-sm">
        Next-Gen Trading API
      </h1>

      <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
        Experience lightning-fast execution, robust security, and seamless portfolio management in one unified platform.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-20">
        <Link href="/register">
          <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/25 group transition-all">
            Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
            Sign In
          </Button>
        </Link>
      </div>

      {/* Feature Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left mt-12">

        <div className="flex flex-col p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">High Performance</h3>
          <p className="text-muted-foreground">Microservice architecture optimized for scalable and low-latency order execution.</p>
        </div>

        <div className="flex flex-col p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
          <p className="text-muted-foreground">Distributed transactions with the Saga pattern ensure absolute consistency across services.</p>
        </div>

        <div className="flex flex-col p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Portfolio Analytics</h3>
          <p className="text-muted-foreground">Real-time market data integration with automated portfolio valuation.</p>
        </div>

      </div>

    </div>
  );
}
