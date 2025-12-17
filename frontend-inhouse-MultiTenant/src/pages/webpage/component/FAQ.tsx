type CategoryId =
  | "general"
  | "customer"
  | "features"
  | "setup"
  | "pricing"
  | "support"
  | "integration"
  | "compliance";

type FaqItem = {
  id: string;
  question: string;
  answer: React.ReactNode;
  tags?: string[];
};

type FaqCategory = {
  id: CategoryId;
  label: string;
  items: FaqItem[];
};

export const faqData: FaqCategory[] = [
  {
    id: "general",
    label: "General",
    items: [
      {
        id: "general-1",
        question: "What is SWAAD SETU?",
        answer: (
          <>
            <p className="mt-4 mb-3 text-sm text-[#666666] leading-relaxed">
              SWAAD SETU is a QR-based digital ordering and payment platform
              designed specifically for restaurants. Customers scan a QR code at
              their table, browse the digital menu on their smartphone, place
              orders, and pay directly—all without downloading an app.
            </p>
          </>
        ),
        tags: ["QR Code", "Ordering", "Contactless"],
      },
      {
        id: "general-2",
        question: "Do customers need to download an app?",
        answer: (
          <p className="mt-4 mb-3 text-sm text-[#666666] leading-relaxed">
            <strong>No!</strong> Customers simply scan the QR code with their
            smartphone camera or any built-in QR scanner app and can start
            ordering instantly, with no app download required.
          </p>
        ),
      },
      {
        id: "general-3",
        question: "Is SWAAD SETU suitable for all restaurant types?",
        answer: (
          <>
            <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
              <strong>Yes!</strong> SWAAD SETU is designed for:
            </p>
            <ul className="ml-5 mb-3 list-disc text-sm text-[#666666] gap-y-1.5">
              <li>Dine-in restaurants</li>
              <li>Cafes and fast food chains</li>
              <li>Fine dining establishments</li>
              <li>Bars and lounges</li>
              <li>Any food service business</li>
            </ul>
          </>
        ),
      },
      {
        id: "general-4",
        question: "How quickly can I get started?",
        answer: (
          <>
            <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
        <strong>Get started instantly!</strong> Just sign up and pay to access your account immediately with zero waiting time.
            </p>
          
          </>
        ),
      },
      {
        id: "general-5",
        question: "How dose SWAAD SETU compare with competitors?",
        answer: (
          <>
            <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong> SWAAD SETU</strong> stands out because : 
            </p>
            <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
              <li>No app download required</li>
              <li>Affordable pricing tailored for Indian restaurants</li>
              <li>Local support in your timezone</li>
              <li>Quick implementation </li>
              <li>Strong focus on small to medium restaurants</li>
            </ul>
          </>
        ),
      },
      {
        id: "general-6",
        question: "Can I migrate from another platform?",
        answer: (
          <>
            <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong> Yes!</strong> We handle complete migration: 
            </p>
            <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
              <li>Transfer your existing menu and data</li>
              <li>Zero downtime during switch</li>
              <li>Our team assists throughout the process</li>
              <li>No data loss</li>
              <li>Contact our migration team for details</li>
            </ul>
          </>
        ),
      },
     
      // ...add all remaining general questions similarly
    ],
  },
 
{
  id: "customer",
  label: "Customer Experience",
  items: [
    {
      id: "customer-1",
      question: "What payment methods are supported?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            We support all major Indian payment methods:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li><strong>Digital Wallets:</strong> Google Pay,  PhonePe, Paytm</li>
            <li><strong>Banking:</strong> UPI, Net Banking</li>

          </ul>
        </>
      ),
    },
    {
      id: "customer-2",
      question: "Can customers track their orders?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Yes! After placing an order, customers can:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>View order status in real-time</li>
            <li>Receive notifications when order is ready</li>
            <li>See estimated preparation time</li>
          </ul>
        </>
      ),
    },
    {
      id: "customer-3",
      question: "Is the ordering process secure?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Absolutely!</strong> We use:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>HTTPS encryption for all connections</li>
            <li>Secure data transmission</li>
            <li>Regular security audits</li>
          </ul>
        </>
      ),
    },
    {
      id: "customer-4",
      question: "Can multiple customers at the same table order independently?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> Group ordering works perfectly:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Each places independent orders</li>
            <li>Separate payment options</li>
            <li>Great for group dining experiences</li>
            <li>Each customer gets their own order tracking</li>
          </ul>
        </>
      ),
    },
    // {
    //   id: "customer-5",
    //   question: "What happens if a customer loses internet mid-order?",
    //   answer: (
    //     <>
    //       <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
    //         The system is resilient:
    //       </p>
    //       <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
    //         <li>Order details are saved in real-time</li>
    //         <li>Customer can reconnect and complete order</li>
    //         <li>No need to start over</li>
    //         <li>Secure session recovery</li>
    //         <li>Support team can assist if needed</li>
    //       </ul>
    //     </>
    //   ),
    // },
    {
      id: "customer-6",
      question: "Can customers customize items (add-ons, toppings)?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Absolutely!</strong> Full customization available:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Extra toppings and sauces</li>
            <li>Spice level preferences</li>
            <li>Allergy information notes</li>
            <li>Size variations</li>
            <li>Special requests and instructions</li>
            <li>Different pricing for variations</li>
          </ul>
        </>
      ),
    },
  ],
}
,
  {
  id: "features",
  label: "Features & Benefits",
  items: [
    {
      id: "features-1",
      question: "What are the main features for restaurants?",
      answer: (
        <>
          <p className="mt-4 mb-1 text-sm text-[#666666] leading-relaxed">
            <strong>Menu Management:</strong> Easy-to-update digital menu with real-time availability
          </p>
          <p className="mb-1 text-sm text-[#666666] leading-relaxed">
            <strong>Order Management:</strong> Real-time tracking with Kitchen Display System integration
          </p>
          <p className="mb-1 text-sm text-[#666666] leading-relaxed">
            <strong>Analytics:</strong> Revenue reports, popular items, peak hours analysis
          </p>
          <p className="mb-1 text-sm text-[#666666] leading-relaxed">
            <strong>Marketing:</strong> Run promotions, discounts
          </p>
        </>
      ),
    },
    {
      id: "features-2",
      question: "How can I manage my menu?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Menu management is simple:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Log in to dashboard</li>
            <li>Add/Edit/Delete items easily</li>
            <li>Upload product images</li>
            <li>Set prices and descriptions</li>
            <li>Mark items as available or out of stock</li>
            <li>Changes appear instantly on customer phones</li>
          </ul>
        </>
      ),
    },
    {
      id: "features-3",
      question: "Can I run promotional offers?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> Create various promotions:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Time-limited discounts</li>
            <li>Bundle deals and combos</li>
            <li>Category-specific offers</li>
            <li>Minimum order value discounts</li>
          </ul>
        </>
      ),
    },
  ],
},
{
  id: "setup",
  label: "Setup & Technical",
  items: [
    {
      id: "setup-1",
      question: "What hardware do I need?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Minimal hardware required:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Computer/Laptop for dashboard management</li>
            <li>Stable internet connection</li>
            <li>Optional: Kitchen display screen or tablet</li>
            <li>Printed QR codes for tables</li>
          </ul>
          <p className="text-sm text-[#666666] leading-relaxed">
            No expensive POS terminals needed!
          </p>
        </>
      ),
    },
    {
      id: "setup-2",
      question: "What internet speed do I need?",
      answer: (
        <>
          {/* <p className="mt-4 mb-1 text-sm text-[#666666] leading-relaxed">
            <strong>Minimum:</strong> 2 Mbps (stable connection)
          </p> */}
          <p className="mb-1 text-sm text-[#666666] leading-relaxed">
            <strong>Recommended:</strong> 5+ Mbps for smooth performance with multiple users
          </p>
          <p className="text-sm text-[#666666] leading-relaxed">
            System works on slower connections, though responsiveness may be slightly reduced.
          </p>
        </>
      ),
    },
    {
      id: "setup-3",
      question: "Does SWAAD SETU work with existing POS systems?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> We integrate with most popular POS systems through:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Direct integration with leading POS platforms</li>
            <li>API access for custom integrations</li>
            <li>Manual sync options</li>
          </ul>
          <p className="text-sm text-[#666666] leading-relaxed">
            Contact support for your specific POS compatibility.
          </p>
        </>
      ),
    },
  ],
}
,

// Prcing and Billing
{
  id: "pricing",
  label: "Pricing & Billing",
  items: [
    {
      id: "pricing-1",
      question: "What pricing plans are available?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            We offer flexible pricing plans:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>
              <strong>Basic Plan:</strong> For small restaurants with 1-2 locations
            </li>
            <li>
              <strong>Professional Plan:</strong> For growing restaurants with advanced features
            </li>
            <li>
              <strong>Enterprise Plan:</strong> For multi-location chains with custom requirements
            </li>
          </ul>
        
        </>
      ),
    },
    {
      id: "pricing-2",
      question: "Is there a contract serving period?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong>12 months serving period
          </p>
          {/* <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Month-to-month plans have no lock-in</li>
            <li>Cancel anytime with 7 days notice</li>
            <li>Annual plans: 20% discount but 12-month commitment</li>
            <li>30-day money-back guarantee if not satisfied</li>
          </ul> */}
        </>
      ),
    },
    {
      id: "pricing-3",
      question: "Do transaction fees apply to cash orders?",
      answer: (
        <>
          <p className="mt-4 mb-3 text-sm text-[#666666] leading-relaxed">
            <strong>No!</strong> Transaction fees only apply to digital payments. Cash orders have no
            additional fees beyond your annual subscription.
          </p>
        </>
      ),
    },
    {
      id: "pricing-4",
      question: "Can I change my plan anytime?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> Flexible plan changes:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Upgrade anytime mid-month</li>
            <li>Pro-rated billing for changes</li>
            <li>No penalties for upgrades</li>
            <li>Immediate feature access</li>
          </ul>
        </>
      ),
    },
    {
      id: "pricing-5",
      question: "What if I run both dine-in and delivery?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Perfect!</strong> Multi-channel support:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Separate order tracking for dine-in and delivery</li>
            <li>Different menus if needed</li>
            <li>Unified dashboard</li>
            <li>Combined analytics and reporting</li>
            <li>Seamless integration</li>
          </ul>
        </>
      ),
    },
    {
      id: "pricing-6",
      question: "Are there any hidden fees?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Completely transparent pricing:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>No setup fees (except enterprise custom work)</li>
            <li>No hidden charges</li>
            <li>All features included in plan</li>
          </ul>
        </>
      ),
    },
  ],
},

//Support

{
  id: "support",
  label: "Support & Training",
  items: [
    {
      id: "support-1",
      question: "What support do you provide?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Comprehensive support available:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>
              <strong>24/7 Email Support</strong> - Get answers to your questions
            </li>
            <li>
              <strong>Phone Support</strong> - During business hours
            </li>
            {/* <li>
              <strong>Live Chat</strong> - Quick responses to immediate issues
            </li> */}
            <li>
              <strong>Video Tutorials</strong> - Learn at your own pace
            </li>
            <li>
              <strong>Knowledge Base</strong> - Self-help documentation
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "support-2",
      question: "Do you provide training for my staff?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> We provide:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Onboarding training when you set up</li>
            <li>Video tutorials for self-paced learning</li>
            <li>Detailed documentation and guides</li>

          </ul>
        </>
      ),
    },
    {
      id: "support-3",
      question: "What is your average response time for support?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Fast support response:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>
              <strong>Email:</strong> Response within 1-2 hours
            </li>
            <li>
              <strong>Live Chat:</strong> Immediate response
            </li>
            <li>
              <strong>Phone:</strong> Within 30 minutes during business hours
            </li>
            <li>
              <strong>Average resolution:</strong> Less than 24 hours
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "support-4",
      question: "How do I contact support?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Multiple support channels:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>
              <strong>Email:</strong> connect@swaadsetu.com
            </li>
            <li>
              <strong>Phone:</strong> +91-9407655717 (business hours)
            </li>
            {/* <li>
              <strong>Live Chat:</strong> On website (real-time)
            </li> */}
            <li>
              <strong>WhatsApp:</strong> Message for quick help
            </li>
            <li>
              <strong>Knowledge Base:</strong> Self-help articles
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "support-5",
      question: "Do you have video tutorials?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> Comprehensive video library:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Getting started guide</li>
            <li>Menu management tutorials</li>
            <li>Payment setup walkthrough</li>
            <li>Analytics dashboard overview</li>
            <li>Troubleshooting guides</li>
            <li>Available on-demand anytime</li>
          </ul>
        </>
      ),
    },
    {
      id: "support-6",
      question: "Can I request new features?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Absolutely!</strong> We listen to feedback:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Request features in dashboard</li>
            <li>Vote on upcoming features</li>
            <li>Roadmap transparency</li>
            <li>Regular feature updates</li>
            <li>Community-driven development</li>
          </ul>
        </>
      ),
    },
  ],
},

//Integration

{
  id: "integration",
  label: "Integration & Compatibility",
  items: [
    {
      id: "integration-1",
      question: "What devices and platforms are supported?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            SWAAD SETU works on all devices:
          </p>
          {/* <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>
              <strong>iOS:</strong> iPhone 6 and newer
            </li>
            <li>
              <strong>Android:</strong> Android 5.0 and newer
            </li>
            <li>
              <strong>Tablets:</strong> iPad and Android tablets
            </li>
            <li>
              <strong>Computers:</strong> Windows, Mac, Linux
            </li>
          </ul> */}
          <p className="text-sm text-[#666666] leading-relaxed">
            No app downloads needed!
          </p>
        </>
      ),
    },
    // {
    //   id: "integration-2",
    //   question: "Can I integrate with delivery platforms?",
    //   answer: (
    //     <>
    //       <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
    //         <strong>Yes!</strong> We support integrations with:
    //       </p>
    //       <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
    //         <li>Zomato - Order aggregation</li>
    //         <li>Swiggy - Delivery management</li>
    //         <li>Custom delivery partners via API</li>
    //       </ul>
    //       <p className="text-sm text-[#666666] leading-relaxed">
    //         More integrations coming soon!
    //       </p>
    //     </>
    //   ),
    // },
    {
      id: "integration-3",
      question: "Can I export my data?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> Export data formats include:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Orders data - Excel or CSV</li>
            <li>Customer data - With permissions</li>
            <li>Financial reports - For accounting</li>
            <li>Analytics reports - For business analysis</li>
          </ul>
          <p className="text-sm text-[#666666] leading-relaxed">
            Available anytime from dashboard.
          </p>
        </>
      ),
    },
    // {
    //   id: "integration-4",
    //   question: "Does SWAAD SETU work with delivery apps?",
    //   answer: (
    //     <>
    //       <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
    //         <strong>Yes!</strong> Popular integrations:
    //       </p>
    //       <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
    //         <li>Zomato integration for order aggregation</li>
    //         <li>Swiggy delivery management</li>
    //         <li>Custom integrations via API</li>
    //         <li>Manual order sync option</li>
    //         <li>More partners coming soon</li>
    //       </ul>
    //     </>
    //   ),
    // },
    {
      id: "integration-5",
      question: "Can I integrate with accounting software?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Currently available:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Export financial data (CSV, Excel)</li>
            <li>Direct Tally integration (coming soon)</li>
            <li>QuickBooks integration (planned)</li>
            <li>Custom API for integrations</li>
            <li>Audit trail for compliance</li>
          </ul>
        </>
      ),
    },
    // {
    //   id: "integration-6",
    //   question: "Is there an API for developers?",
    //   answer: (
    //     <>
    //       <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
    //         <strong>Yes!</strong> Developer-friendly:
    //       </p>
    //       <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
    //         <li>RESTful API documentation</li>
    //         <li>Webhook support for events</li>
    //         <li>Sandbox environment for testing</li>
    //         <li>SDK for popular languages</li>
    //         <li>Dedicated developer support</li>
    //       </ul>
    //     </>
    //   ),
    // },
  ],
},
//Compliance

{
  id: "compliance",
  label: "Compliance & Legal",
  items: [
    {
      id: "compliance-1",
      question: "Is SWAAD SETU GST compliant?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> We're fully GST-compliant:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Automatic GST calculation based on item classification</li>
            <li>GST-compliant invoices and receipts</li>
            <li>GSTR-1 ready reports for GST filing</li>
            <li>Complete audit trails for compliance</li>
          </ul>
        </>
      ),
    },
    {
      id: "compliance-2",
      question: "How is customer data protected?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            We follow strict data protection:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>Customer data never shared with third parties</li>
            <li>Encryption for all data transmission</li>
            <li>Explicit user consent before data collection</li>
            <li>Regular data backups and disaster recovery</li>
          </ul>
        </>
      ),
    },
    {
      id: "compliance-3",
      question: "Do I need FSSAI license to use SWAAD SETU?",
      answer: (
        <>
          <p className="mt-4 mb-3 text-sm text-[#666666] leading-relaxed">
            SWAAD SETU doesn't require FSSAI compliance as it's a technology
            platform. However,{" "}
            <strong>
              your restaurant must maintain its own FSSAI license and food
              safety compliance.
            </strong>{" "}
            We provide features to help with compliance documentation.
          </p>
        </>
      ),
    },
    {
      id: "compliance-4",
      question: "Is SWAAD SETU PCI-DSS compliant?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            <strong>Yes!</strong> Enterprise security:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>PCI-DSS Level 1 compliance</li>
            <li>Regular third-party audits</li>
            <li>Secure payment processing</li>
            <li>Encrypted data storage</li>
            <li>Compliance certificates available</li>
          </ul>
        </>
      ),
    },
    {
      id: "compliance-5",
      question: "What about data privacy and GDPR?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Full compliance standards:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>GDPR compliant for EU customers</li>
            <li>Data privacy policy transparent</li>
            <li>User consent for data collection</li>
            <li>Right to data deletion</li>
            <li>Regular compliance updates</li>
          </ul>
        </>
      ),
    },
    {
      id: "compliance-6",
      question: "How long do you retain customer data?",
      answer: (
        <>
          <p className="mt-4 mb-2 text-sm text-[#666666] leading-relaxed">
            Clear retention policy:
          </p>
          <ul className="ml-5 mb-3 list-disc text-sm text-[#666666]">
            <li>
              <strong>Transaction data:</strong> 7 years (GST compliance)
            </li>
            <li>
              <strong>Customer contact:</strong> Until opt-out
            </li>
            <li>
              <strong>Usage analytics:</strong> 2 years
            </li>
            <li>Automatic purging of old data</li>
            <li>Manual deletion on request</li>
          </ul>
        </>
      ),
    },
  ],
}

 
];
