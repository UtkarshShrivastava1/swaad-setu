import { useEffect, useState } from 'react';
import { ArrowRight, Star, TrendingUp } from 'lucide-react';
import { getMenuItems, getCombos } from '../services/api';
import  type { MenuItem, Combo } from '../types';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, comboData] = await Promise.all([
          getMenuItems(),
          getCombos()
        ]);
        setMenuItems(items.filter(item => item.isPopular));
        setCombos(comboData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-slowZoom"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=1600)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>
        </div>

        <div className="relative z-10 text-center px-4 animate-fadeIn">
          <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-6 animate-slideUp">
            Swaadsetu
          </h1>
          <p className="text-2xl md:text-4xl text-white mb-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            Where Every Bite Feels Like Home
          </p>
          <p className="text-lg md:text-xl text-gray-300 mb-12 animate-slideUp" style={{ animationDelay: '0.4s' }}>
            Authentic Indian Flavours Delivered to Your Doorstep
          </p>
          <button
            onClick={() => onNavigate('gallery')}
            className="group bg-yellow-400 text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 animate-slideUp inline-flex items-center gap-2"
            style={{ animationDelay: '0.6s' }}
          >
            Explore Menu
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-yellow-400 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-yellow-400 rounded-full animate-scroll"></div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-3">
            <Star className="animate-spin-slow" />
            Popular Dishes
            <Star className="animate-spin-slow" />
          </h2>
          <p className="text-gray-400 text-lg">Taste the favorites loved by thousands</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-900 rounded-2xl h-96 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className="group bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-yellow-400/20 hover:border-yellow-400 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-400/20 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-sm">
                    ₹{item.price}
                  </div>
                  {item.isPopular && (
                    <div className="absolute top-4 left-4 bg-black/80 text-yellow-400 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                      <TrendingUp size={16} />
                      Popular
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-gray-400 mb-4">{item.description}</p>
                  <div className="text-yellow-400 text-sm font-medium">{item.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">
              Special Combo Offers
            </h2>
            <p className="text-gray-400 text-lg">Save more with our curated meal combos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {combos.map((combo, index) => (
              <div
                key={combo.id}
                className="relative group bg-black rounded-3xl overflow-hidden border-2 border-yellow-400/30 hover:border-yellow-400 transition-all duration-500 transform hover:scale-105 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="absolute top-6 right-6 z-10">
                  <div className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-lg">
                    Save ₹{combo.savings}
                  </div>
                </div>
                <div className="md:flex">
                  <div className="md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                    <img
                      src={combo.image}
                      alt={combo.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="md:w-1/2 p-8">
                    <h3 className="text-3xl font-bold text-yellow-400 mb-4">{combo.name}</h3>
                    <div className="space-y-2 mb-6">
                      {combo.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-white">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-4xl font-bold text-yellow-400">₹{combo.price}</span>
                      <span className="text-gray-500 line-through text-xl mb-1">₹{combo.price + combo.savings}</span>
                    </div>
                    <button className="w-full bg-yellow-400 text-black py-3 rounded-full font-bold hover:bg-yellow-300 transition-colors transform hover:scale-105">
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1268558/pexels-photo-1268558.jpeg?auto=compress&cs=tinysrgb&w=1600)',
          }}
        >
          <div className="absolute inset-0 bg-black/80"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Experience <span className="text-yellow-400">Authentic Flavours</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of happy customers who trust Swaadsetu for their daily meals
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="bg-yellow-400 text-black px-10 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
          >
            Get in Touch
            <ArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
}
