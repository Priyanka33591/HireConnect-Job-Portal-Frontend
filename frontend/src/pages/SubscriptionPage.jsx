import { useEffect, useState } from "react";
import Shell from "../components/Shell";
import {
  cancelSubscription,
  createRazorpayOrder,
  createSubscription,
  listInvoices,
  getCurrentSubscription,
} from "../api/subscriptions";

const CANDIDATE_PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "0",
    features: ["10 job applications / month", "Standard profile visibility", "Basic job alerts"],
    color: "from-slate-500/20 to-slate-500/5",
  },
  {
    id: "MONTHLY_99",
    name: "Standard",
    price: "99",
    features: ["20 job applications / month", "Enhanced profile visibility", "Priority job alerts"],
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    id: "MONTHLY_199",
    name: "Premium",
    price: "199",
    features: ["50 job applications / month", "Max profile visibility", "Direct messaging to recruiters"],
    color: "from-purple-500/20 to-purple-500/5",
  },
];

const RECRUITER_PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "0",
    features: ["10 job postings / month", "Standard applicant tracking", "Basic company profile"],
    color: "from-slate-500/20 to-slate-500/5",
  },
  {
    id: "MONTHLY_99",
    name: "Business",
    price: "99",
    features: ["20 job postings / month", "Advanced applicant filtering", "Featured company profile"],
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    id: "MONTHLY_199",
    name: "Enterprise",
    price: "199",
    features: ["50 job postings / month", "Premium applicant analytics", "Custom branding & AI matching"],
    color: "from-amber-500/20 to-amber-500/5",
  },
];

export default function SubscriptionPage() {
  const userId = Number(localStorage.getItem("hc_user_id"));
  const role = localStorage.getItem("hc_role") === "ROLE_RECRUITER" ? "RECRUITER" : "CANDIDATE";
  const [currentSub, setCurrentSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const plans = role === "RECRUITER" ? RECRUITER_PLANS : CANDIDATE_PLANS;

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [sub, invs] = await Promise.all([
        getCurrentSubscription(userId, role),
        listInvoices(userId),
      ]);
      setCurrentSub(sub);
      setInvoices(invs);
    } catch (e) {
      setError("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubscribe = async (planId) => {
    if (planId === "FREE") {
      // Logic for switching back to free if allowed
      return;
    }

    try {
      const order = await createRazorpayOrder(userId, role, planId);
      
      const options = {
        key: order.key,
        amount: order.amount,
        currency: "INR",
        name: "HireConnect",
        description: `Subscription for ${planId}`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await createSubscription({
              userId,
              userRole: role,
              plan: planId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            loadData();
          } catch (err) {
            setError("Payment successful, but subscription activation failed. Please contact support.");
          }
        },
        prefill: {
          name: localStorage.getItem("hc_user_name") || "",
          email: localStorage.getItem("hc_user_email") || "",
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Failed to initiate payment");
    }
  };

  const printInvoice = (inv) => {
    const userName = localStorage.getItem("hc_display_name") || "Valued User";
    const userEmail = localStorage.getItem("hc_email") || "";
    
    const html = `
      <html>
        <head>
          <title>Invoice - ${inv.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; }
            .invoice-title { font-size: 28px; font-weight: 700; color: #0f172a; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
            .value { font-size: 15px; font-weight: 500; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
            .total-row { background: #f8fafc; font-weight: 700; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">HireConnect</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Recruitment Solution</div>
            </div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="grid">
            <div>
              <div class="label">Billed To:</div>
              <div class="value">${userName}</div>
              <div class="value">${userEmail}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Invoice Details:</div>
              <div class="value">Invoice #: ${inv.id}</div>
              <div class="value">Date: ${new Date(inv.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
              <div class="value">Status: PAID</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Order ID</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: 600;">HireConnect ${inv.plan} Subscription</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Monthly plan for ${role.toLowerCase()}s</div>
                </td>
                <td style="font-family: monospace; font-size: 12px;">${inv.razorpayOrderId}</td>
                <td style="text-align: right; font-weight: 600;">₹${inv.amountCents / 100}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">Total Amount Paid</td>
                <td style="text-align: right;">₹${inv.amountCents / 100}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Thank you for choosing HireConnect!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
          </div>
          
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-10 pb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Choose Your Plan</h2>
          <p className="mt-2 text-slate-400">
            Scale your {role.toLowerCase()} journey with our premium features.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-6 shadow-2xl ${p.color} transition-transform hover:scale-[1.02]`}
            >
              {currentSub?.plan === p.id && (
                <div className="absolute top-4 right-4 rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/30">
                  Current Plan
                </div>
              )}
              
              <div className="text-lg font-semibold text-white">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">₹{p.price}</span>
                <span className="text-slate-400">/month</span>
              </div>

              <ul className="mt-6 space-y-4">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(p.id)}
                disabled={currentSub?.plan === p.id}
                className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                  currentSub?.plan === p.id
                    ? "bg-white/5 text-slate-500 cursor-not-allowed"
                    : "bg-white text-slate-900 hover:bg-blue-50"
                }`}
              >
                {currentSub?.plan === p.id ? "Current Plan" : p.price === "0" ? "Active" : "Upgrade Now"}
              </button>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">Billing History</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                  <th className="px-6 py-4 font-medium">Invoice ID</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-slate-300 transition-colors hover:bg-white/5">
                    <td className="px-6 py-4">#{inv.id}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider">
                        {inv.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">₹{inv.amountCents / 100}</td>
                    <td className="px-6 py-4 font-mono text-xs">{inv.razorpayOrderId}</td>
                    <td className="px-6 py-4 text-xs">{new Date(inv.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => printInvoice(inv)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1 justify-end ml-auto"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                      No billing history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
