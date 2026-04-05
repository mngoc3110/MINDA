"use client";

import { useEffect, useState } from "react";
import { Users, Shield, GraduationCap, Lock, Unlock, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: number, newRole: string) => {
    if (!confirm(`Bạn có chắc chắn đổi quyền của ID ${userId} thành ${newRole.toUpperCase()} không?`)) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users/${userId}/role?new_role=${newRole}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Đã thay đổi quyền thành công!");
        fetchUsers();
      } else {
        alert("Đổi quyền thất bại!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deactivateUser = async (userId: number) => {
    if (!confirm(`Bạn có chắc chắn vô hiệu hoá / khoá tài khoản có ID ${userId} không? Hành động này sẽ khiến người dùng không thể đăng nhập.`)) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Đã khoá tài khoản thành công!");
        fetchUsers();
      } else {
        alert("Khoá tài khoản thất bại!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Quản lý Người Dùng</h1>
          <p className="text-gray-400">Xem, phân quyền và khoá tài khoản thành viên.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm email/tên..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-red-500/50 outline-none text-sm transition-all text-white w-64 focus:w-72"
            />
          </div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-sm text-gray-300 hover:text-white transition-colors"
          >
            <option value="all">Tất cả Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0a0a0a]/80 border border-white/10 rounded-3xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/5 font-semibold text-gray-400">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Họ và Tên</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Vai trò (Role)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                   </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy người dùng nào phù hợp.
                   </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={user.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-gray-400">#{user.id}</td>
                    <td className="px-6 py-4 font-medium">{user.full_name || "Chưa cập nhật"}</td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-400/10 text-red-400 text-xs font-bold border border-red-400/20"><Shield className="w-3 h-3"/> Admin</span>}
                      {user.role === 'teacher' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-400/10 text-blue-400 text-xs font-bold border border-blue-400/20"><GraduationCap className="w-3 h-3"/> Teacher</span>}
                      {user.role === 'student' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-400/10 text-green-400 text-xs font-bold border border-green-400/20"><Users className="w-3 h-3"/> Student</span>}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs"><Unlock className="w-3 h-3" /> Đang hoạt động</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-xs"><Lock className="w-3 h-3" /> Bị khoá</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {/* Nếu là Admin hệ thống ID=1 thì không cho phép sửa/xoá để bảo vệ an toàn */}
                         {user.id !== 1 && (
                            <>
                              <select 
                                onChange={(e) => changeRole(user.id, e.target.value)}
                                value={user.role}
                                className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg outline-none hover:bg-white/10 transition-colors"
                              >
                                <option value="student">Chuyển thành Student</option>
                                <option value="teacher">Chuyển thành Teacher</option>
                                <option value="admin">Chuyển thành Admin</option>
                              </select>
                              {user.is_active && (
                                <button 
                                  onClick={() => deactivateUser(user.id)}
                                  title="Khoá tài khoản này"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              )}
                            </>
                         )}
                         {user.id === 1 && <span className="text-xs text-gray-500 italic">Hệ thống cốt lõi</span>}
                       </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
