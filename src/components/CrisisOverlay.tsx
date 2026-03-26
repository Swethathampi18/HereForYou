import { Phone, Heart } from "lucide-react";

export const CrisisOverlay = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-destructive/95 flex items-center justify-center p-6" style={{ pointerEvents: "all" }}>
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive-foreground/20 flex items-center justify-center mx-auto">
          <Heart className="h-8 w-8 text-destructive-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-destructive-foreground">You Are Not Alone</h1>
        <p className="text-destructive-foreground/90">
          We've detected that you may be in crisis. A licensed clinician has been notified and will reach out to you immediately. In the meantime, please reach out to one of these helplines:
        </p>
        <div className="space-y-3">
          {[
            { name: "iCall", number: "9152987821", desc: "Mon-Sat, 8am-10pm" },
            { name: "Vandrevala Foundation", number: "18602662345", desc: "24/7" },
            { name: "AASRA", number: "9820466726", desc: "24/7" },
          ].map((h) => (
            <a key={h.name} href={`tel:${h.number}`} className="flex items-center gap-3 p-4 rounded-xl bg-destructive-foreground/10 hover:bg-destructive-foreground/20 transition-colors">
              <Phone className="h-5 w-5 text-destructive-foreground" />
              <div className="text-left">
                <p className="font-semibold text-destructive-foreground">{h.name}: {h.number}</p>
                <p className="text-xs text-destructive-foreground/70">{h.desc}</p>
              </div>
            </a>
          ))}
        </div>
        <p className="text-xs text-destructive-foreground/60">This screen cannot be dismissed. Help is on the way.</p>
      </div>
    </div>
  );
};
