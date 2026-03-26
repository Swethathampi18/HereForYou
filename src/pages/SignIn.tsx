import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { Heart } from "lucide-react";

const SignIn = () => (
  <PageTransition>
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">HereForYou</span>
          </Link>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Welcome back</h1>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button className="w-full" size="lg">Sign In</Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New here?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">Get Started</Link>
          </p>
        </div>
      </div>
    </div>
  </PageTransition>
);

export default SignIn;
