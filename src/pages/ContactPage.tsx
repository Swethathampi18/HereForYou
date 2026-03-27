import { useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, ArrowLeft, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ContactPage = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!name || !email || !message) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    toast({ title: "Thank you! We'll get back to you within 24 hours." });
    setName(""); setEmail(""); setSubject(""); setMessage("");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <Link to="/" className="flex items-center gap-2"><Heart className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">HereForYou</span></Link>
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground mb-8">We're here to help. Reach out to us through any of the channels below.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-xl border p-4 flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div><p className="font-medium text-foreground text-sm">Email</p><p className="text-sm text-muted-foreground">hereforyou@gmail.com</p></div>
            </div>
            <div className="bg-card rounded-xl border p-4 flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div><p className="font-medium text-foreground text-sm">Phone</p><p className="text-sm text-muted-foreground">+91 98765 43210</p><p className="text-xs text-muted-foreground">Mon-Sat, 9 AM - 6 PM IST</p></div>
            </div>
            <div className="bg-card rounded-xl border p-4 flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
              <div><p className="font-medium text-foreground text-sm">Crisis Support</p><p className="text-xs text-muted-foreground">iCall: 9152987821<br />Vandrevala Foundation: 1860-2662-345</p></div>
            </div>
            <div className="bg-card rounded-xl border p-4 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div><p className="font-medium text-foreground text-sm">Address</p><p className="text-xs text-muted-foreground">HereForYou Health Tech Pvt. Ltd.<br />42, 3rd Floor, Koramangala Industrial Layout,<br />Bangalore - 560034, Karnataka, India</p></div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Send us a message</h2>
            <div><Label>Name</Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Subject</Label><Input className="mt-1" value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea className="mt-1" value={message} onChange={e => setMessage(e.target.value)} /></div>
            <Button onClick={handleSubmit}>Send Message</Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ContactPage;
