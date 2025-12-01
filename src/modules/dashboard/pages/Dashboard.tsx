import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isLoading] = useState(true);
  const [hasError] = useState(true);
  const [particles, setParticles] = useState([]);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef([]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: isLoading ? 'Đang tải...' : '2,890,123,000₫',
      change: isLoading ? '—' : '+12.5%',
      trend: 'neutral',
      icon: DollarSign,
    },
    {
      title: 'Người dùng hoạt động',
      value: isLoading ? 'Đang tải...' : '8,549',
      change: isLoading ? '—' : '+8.2%',
      trend: 'neutral',
      icon: Users,
    },
    {
      title: 'Đơn hàng',
      value: isLoading ? 'Đang tải...' : '2,847',
      change: isLoading ? '—' : '-2.1%',
      trend: 'neutral',
      icon: ShoppingCart,
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      value: isLoading ? 'Đang tải...' : '3.24%',
      change: isLoading ? '—' : '+5.4%',
      trend: 'neutral',
      icon: Target,
    }
  ];

  const recentActivity = [
    { id: 1, action: 'Đơn hàng mới #12847', time: '2 phút trước', status: 'success', icon: ShoppingCart },
    { id: 2, action: 'Lượng đăng ký người dùng tăng', time: '15 phút trước', status: 'info', icon: Users },
    { id: 3, action: 'Thanh toán thất bại #12846', time: '32 phút trước', status: 'error', icon: AlertCircle },
    { id: 4, action: 'Bảo trì máy chủ hoàn tất', time: '1 giờ trước', status: 'success', icon: CheckCircle },
    { id: 5, action: 'Phát hiện lưu lượng truy cập cao', time: '2 giờ trước', status: 'warning', icon: Activity }
  ];

  const topProducts = [
    { name: 'Tai nghe không dây', sales: 1247, revenue: '573,620,000₫', trend: 'up' },
    { name: 'Đồng hồ thông minh Pro', sales: 892, revenue: '820,640,000₫', trend: 'up' },
    { name: 'Bàn phím cơ', sales: 654, revenue: '300,840,000₫', trend: 'down' },
    { name: 'Hub USB-C', sales: 543, revenue: '374,670,000₫', trend: 'up' },
    { name: 'Loa Bluetooth', sales: 432, revenue: '198,720,000₫', trend: 'down' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30';
      case 'error': return 'bg-red-400/10 text-red-400 border-red-400/30';
      case 'warning': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30';
      case 'info': return 'bg-blue-400/10 text-blue-400 border-blue-400/30';
      default: return 'bg-gray-400/10 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden">

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed rounded-full bg-cyan-400 opacity-10 pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div 
          ref={el => sectionRefs.current[0] = el}
          data-section="header"
          className={`mb-12 transition-all duration-1000 ${
            visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-light mb-3">
                <span className="text-white">Bảng điều khiển </span>
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Tổng quan</span>
              </h1>
              <p className="text-gray-400 font-light text-lg">Theo dõi các chỉ số kinh doanh của bạn trong thời gian thực</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phân tích..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-5 py-3 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl text-gray-400 font-light hover:border-cyan-400/50 hover:text-cyan-400 transition-all duration-300">
                <Filter className="w-5 h-5" />
                <span>Lọc</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl px-5 py-3 text-white font-light focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
              >
                <option value="24h">24 giờ qua</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="90d">90 ngày qua</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div 
          ref={el => sectionRefs.current[1] = el}
          data-section="stats"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className={`group bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-cyan-400/50 hover:scale-105 transition-all duration-300 ${
                  visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-light border ${
                    stat.trend === 'up'
                      ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30'
                      : 'bg-red-400/10 text-red-400 border-red-400/30'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : stat.trend === 'down' ? <ArrowDown className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-light text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm font-light">{stat.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Chart Section */}
          <div 
            ref={el => sectionRefs.current[2] = el}
            data-section="chart"
            className={`lg:col-span-2 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 ${
              visibleSections.has('chart') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-white">Phân tích <span className="text-cyan-400">Doanh thu</span></h3>
              <div className="flex items-center gap-2">
                <button className="p-2.5 bg-cyan-400/10 text-cyan-400 rounded-lg hover:bg-cyan-400/20 border border-cyan-400/30 transition-all duration-300 hover:scale-110">
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button className="p-2.5 bg-gray-800/30 text-gray-400 rounded-lg hover:bg-gray-800/50 border border-gray-800/50 transition-all duration-300 hover:scale-110">
                  <PieChart className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64 bg-gray-800/20 rounded-xl flex items-center justify-center border border-gray-800/50 backdrop-blur-sm">
              {hasError ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
                  <p className="text-red-300 font-light">Không thể tải phân tích doanh thu.</p>
                  <p className="text-xs text-gray-500 mt-2">Vui lòng thử lại sau.</p>
                </div>
              ) : (
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
                  <p className="text-gray-500 font-light">Trực quan hóa biểu đồ</p>
                  <p className="text-sm text-cyan-400 mt-2 font-light">Doanh thu có xu hướng tăng 12.5%</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div 
            ref={el => sectionRefs.current[3] = el}
            data-section="activity"
            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 delay-100 ${
              visibleSections.has('activity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h3 className="text-xl font-light text-white mb-6">Hoạt động <span className="text-cyan-400">gần đây</span></h3>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-gray-500 text-sm font-light">Đang tải hoạt động gần đây…</p>
              ) : hasError ? (
                <p className="text-red-400 text-sm font-light">Không thể tải nguồn cấp hoạt động.</p>
              ) : (
                recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-800/20 transition-all duration-300"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${getStatusColor(activity.status)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-light">{activity.action}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <p className="text-xs text-gray-500 font-light">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button className="w-full mt-5 px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800/50 hover:border-cyan-400/50 rounded-xl text-gray-400 hover:text-cyan-400 font-light transition-all duration-300">
              Xem tất cả hoạt động
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div 
            ref={el => sectionRefs.current[4] = el}
            data-section="products"
            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 ${
              visibleSections.has('products') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-white">Sản phẩm <span className="text-cyan-400">hàng đầu</span></h3>
              <button className="group px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-lg text-white font-light transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">
                <span className="flex items-center gap-2">
                  Xem tất cả
                  <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-gray-500 text-sm font-light">Đang tải bảng xếp hạng sản phẩm…</p>
              ) : hasError ? (
                <p className="text-red-400 text-sm font-light">Không thể tải dữ liệu sản phẩm.</p>
              ) : (
                topProducts.map((product, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/20 border border-transparent hover:border-gray-800/50 transition-all duration-300"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-lg flex items-center justify-center">
                        <span className="text-cyan-400 font-light text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-light">{product.name}</p>
                        <p className="text-gray-400 text-sm font-light">{product.sales} đã bán</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-light">{product.revenue}</p>
                      <div className={`flex items-center gap-1 ${product.trend === 'up' ? 'text-cyan-400' : 'text-red-400'}`}>
                        {product.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span className="text-xs font-light">
                          {product.trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 15) + 1}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div 
            ref={el => sectionRefs.current[5] = el}
            data-section="metrics"
            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-800 transition-all duration-1000 delay-100 ${
              visibleSections.has('metrics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h3 className="text-xl font-light text-white mb-6">Chỉ số <span className="text-cyan-400">Hiệu suất</span></h3>
            {isLoading ? (
              <p className="text-gray-500 font-light text-sm">Đang thu thập dữ liệu từ xa…</p>
            ) : hasError ? (
              <div className="text-red-400 font-light text-sm">
                Hiện không thể tải các chỉ số hiệu suất.
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-light">Thời gian phản hồi của máy chủ</span>
                    <span className="text-white font-light">124ms</span>
                  </div>
                  <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-light">Hiệu suất cơ sở dữ liệu</span>
                    <span className="text-white font-light">92%</span>
                  </div>
                  <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 delay-100" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-light">Tỷ lệ thành công của API</span>
                    <span className="text-white font-light">99.7%</span>
                  </div>
                  <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 delay-200" style={{ width: '99.7%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-light">Sử dụng bộ nhớ</span>
                    <span className="text-white font-light">68%</span>
                  </div>
                  <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 delay-300" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            )}

            <button className="group w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-light text-white transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105" disabled>
              <div className="flex items-center justify-center gap-2 opacity-60">
                <Zap className="w-5 h-5" />
                {isLoading ? 'Đang tối ưu hóa…' : hasError ? 'Không có sẵn' : 'Tối ưu hóa hiệu suất'}
                <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-[-2px]" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;