import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../component/Navbar";
import { Footer } from "../component/Footer";
import BackButton from "../component/ui/BackButton";

type BlogCategory = "All" | "Product" | "Design" | "Restaurants" | "Updates";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: BlogCategory;
  readTime: string;
  date: string;
  author: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "How Digital Menus Are Transforming Restaurants in India",
    slug: "digital-menus-transforming-restaurants-india",
    excerpt:
      "From QR-based ordering to live kitchen updates, see how modern tools are changing the way guests experience dining.",
    category: "Restaurants",
    readTime: "6 min read",
    date: "Dec 01, 2025",
    author: "Swaad Setu Team",
  },
  {
    id: 2,
    title: "Designing a Delightful QR Ordering Experience",
    slug: "designing-delightful-qr-ordering-experience",
    excerpt:
      "Good UX can make the difference between a confused guest and a loyal customer. Here’s how we think about flows.",
    category: "Design",
    readTime: "5 min read",
    date: "Nov 25, 2025",
    author: "Product Design",
  },
  {
    id: 3,
    title: "Product Update: Advanced Analytics for Multi-Outlet Brands",
    slug: "product-update-advanced-analytics",
    excerpt:
      "Introducing cross-outlet performance, peak hour analysis, and deep item-level insights for serious operators.",
    category: "Product",
    readTime: "4 min read",
    date: "Nov 18, 2025",
    author: "Product Team",
  },
  {
    id: 4,
    title: "How to Reduce Wait Times Without Hiring More Staff",
    slug: "reduce-wait-times-without-more-staff",
    excerpt:
      "Smart routing, live order tracking, and self-service ordering can dramatically shorten customer wait times.",
    category: "Restaurants",
    readTime: "7 min read",
    date: "Nov 10, 2025",
    author: "Operations",
  },
  {
    id: 5,
    title: "Our Vision for the Future of Contactless Dining",
    slug: "vision-future-contactless-dining",
    excerpt:
      "From discovery to re-ordering, we’re building a connected experience for guests, staff, and owners.",
    category: "Updates",
    readTime: "3 min read",
    date: "Nov 02, 2025",
    author: "Founder’s Note",
  },
];

const CATEGORIES: BlogCategory[] = ["All", "Product", "Design", "Restaurants", "Updates"];

 const BlogsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<BlogCategory>("All");
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      const matchesSearch =
        search.trim().length === 0 ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className=" mb-8 absoute ">
        <BackButton/>
      </div>
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white mt-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-1 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Swaad Setu Blog
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Insights for modern <span className="text-yellow-400">restaurant teams</span>
          </h1>

          <p className="text-gray-700 max-w-2xl mb-6">
            Product updates, practical guides, and stories from restaurants using technology to grow faster and serve
            better.
          </p>

          {/* Search + categories */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="w-full md:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition 
                    ${
                      activeCategory === cat
                        ? "bg-black text-yellow-400 border-black"
                        : "bg-white text-gray-700 border-gray-200 hover:border-black/50"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog list */}
      <section className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-2">No articles found.</p>
              <p className="text-sm text-gray-400">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-gray-500">
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-black">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{post.excerpt}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-3 border-t border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">{post.author}</p>
                      <p>{post.date}</p>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-black group-hover:text-yellow-500"
                    >
                      Read article
                      <span className="transition-transform group-hover:translate-x-0.5">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BlogsPage;