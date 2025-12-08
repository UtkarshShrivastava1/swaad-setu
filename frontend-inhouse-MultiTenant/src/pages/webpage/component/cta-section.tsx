// import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function CTASection() {

   const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  return (
    <section className="py-10 bg-gradient-to-br from-[#FFBE00] via-[#FFD24D] to-[#FFBE00] relative overflow-hidden">
      {/* Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-black rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-20 relative z-10">
        <div className="text-center space-y-8">
          <h2 className="text-5xl lg:text-6xl font-extrabold font-heading text-black leading-tight">
            Ready to Transform Your Restaurant?
          </h2>

          <p className="text-xl text-[#111111] max-w-3xl mx-auto leading-relaxed">
            Join 500+ restaurants already using Swaad Setu to deliver exceptional dining experiences and grow their
            business.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 py-6">
            {["No Setup Fee",  "24/7 Support" ].map((benefit, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm rounded-full px-4 py-2"
              >
                <CheckCircle2 size={20} className="text-black" />
                <span className="font-semibold text-black">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
               onClick={() => scrollToSection('contact')}
              className="bg-black btn-lg btn text-white hover:bg-[#111111] rounded-xl font-semibold text-lg px-10 py-7 shadow-hard group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
               onClick={() => scrollToSection('contact')}
              className="border-2 btn btn-outline btn-lg border-black text-black bg-white hover:bg-black hover:text-white rounded-xl font-semibold text-lg px-10 py-7"
            >
              Book a Demo
            </button>
          </div>

          <p className="text-sm text-[#111111] pt-4">No credit card required • Setup in under 10 minutes</p>
        </div>
      </div>
    </section>
  )
}
