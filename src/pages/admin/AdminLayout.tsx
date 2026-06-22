import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <AdminSidebar />
      <main className="ml-64 min-h-screen overflow-auto p-1.5">
        <div className="bg-white rounded-xl min-h-full p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
