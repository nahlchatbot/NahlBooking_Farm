import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Key, UserCircle } from 'lucide-react';
import {
  adminUsersApi,
  AdminUser,
  CreateAdminUserData,
  UpdateAdminUserData,
} from '../api/client';
import { useAuthStore } from '../store/auth';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  Modal,
  ModalFooter,
  Input,
  Select,
  ConfirmDialog,
  Skeleton,
  EmptyState,
  toast,
} from '../components/ui';

const roleOptions = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'VIEWER', label: 'Viewer' },
];

const getRoleBadgeVariant = (role: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'error';
    case 'ADMIN':
      return 'success';
    case 'VIEWER':
      return 'info';
    default:
      return 'default';
  }
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'مدير عام';
    case 'ADMIN':
      return 'مدير';
    case 'VIEWER':
      return 'مشاهد';
    default:
      return role;
  }
};

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const isRtl = i18n.language === 'ar';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<CreateAdminUserData>>({
    email: '',
    password: '',
    name: '',
    role: 'ADMIN',
    phone: '',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUsersApi.list();
      if (response.ok) {
        setUsers(response.data.users);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast.error(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      setModalLoading(true);
      const response = await adminUsersApi.create(formData as CreateAdminUserData);
      if (response.ok) {
        toast.success(isRtl ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء إنشاء المستخدم' : 'Error creating user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setModalLoading(true);
      const updateData: UpdateAdminUserData = {
        email: formData.email,
        name: formData.name,
        role: formData.role as 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER',
        phone: formData.phone || null,
      };

      const response = await adminUsersApi.update(selectedUser.id, updateData);
      if (response.ok) {
        toast.success(isRtl ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء تحديث المستخدم' : 'Error updating user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setModalLoading(true);
      const response = await adminUsersApi.delete(selectedUser.id);
      if (response.ok) {
        toast.success(isRtl ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully');
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء حذف المستخدم' : 'Error deleting user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error(isRtl ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    try {
      setModalLoading(true);
      const response = await adminUsersApi.changePassword(selectedUser.id, newPassword);
      if (response.ok) {
        toast.success(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error changing password');
    } finally {
      setModalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'ADMIN',
      phone: '',
    });
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openPasswordModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const columns = [
    {
      key: 'name',
      header: isRtl ? 'الاسم' : 'Name',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: isRtl ? 'الدور' : 'Role',
      render: (user: AdminUser) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {isRtl ? getRoleLabel(user.role) : user.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: isRtl ? 'الهاتف' : 'Phone',
      render: (user: AdminUser) => (
        <span className="text-gray-600">{user.phone || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: isRtl ? 'الحالة' : 'Status',
      render: (user: AdminUser) => (
        <Badge variant={user.isActive ? 'success' : 'error'}>
          {user.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: isRtl ? 'آخر دخول' : 'Last Login',
      render: (user: AdminUser) => (
        <span className="text-sm text-gray-500">
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')
            : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: isRtl ? 'الإجراءات' : 'Actions',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(user);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openPasswordModal(user);
            }}
          >
            <Key className="h-4 w-4" />
          </Button>
          {user.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteDialog(user);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title={isRtl ? 'حدث خطأ' : 'Error'}
        description={error}
        action={
          <Button onClick={fetchUsers}>
            {isRtl ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? 'إدارة المستخدمين' : 'Admin Users'}
          </h1>
          <p className="text-gray-500">
            {isRtl ? 'إدارة مستخدمي لوحة التحكم' : 'Manage admin panel users'}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          {isRtl ? 'إضافة مستخدم' : 'Add User'}
        </Button>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          title={isRtl ? 'لا يوجد مستخدمين' : 'No Users'}
          description={isRtl ? 'لم يتم إضافة أي مستخدمين بعد' : 'No users have been added yet'}
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              {isRtl ? 'إضافة مستخدم' : 'Add User'}
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
        />
      )}

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}
      >
        <div className="space-y-4">
          <Input
            label={isRtl ? 'الاسم' : 'Name'}
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={isRtl ? 'البريد الإلكتروني' : 'Email'}
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label={isRtl ? 'كلمة المرور' : 'Password'}
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            hint={isRtl ? '8 أحرف على الأقل' : 'At least 8 characters'}
          />
          <Select
            label={isRtl ? 'الدور' : 'Role'}
            value={formData.role || 'ADMIN'}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER' })}
            options={roleOptions}
          />
          <Input
            label={isRtl ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            disabled={modalLoading}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreateUser} loading={modalLoading}>
            {isRtl ? 'إنشاء' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title={isRtl ? 'تعديل المستخدم' : 'Edit User'}
      >
        <div className="space-y-4">
          <Input
            label={isRtl ? 'الاسم' : 'Name'}
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={isRtl ? 'البريد الإلكتروني' : 'Email'}
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Select
            label={isRtl ? 'الدور' : 'Role'}
            value={formData.role || 'ADMIN'}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER' })}
            options={roleOptions}
            disabled={selectedUser?.id === currentUser?.id}
          />
          <Input
            label={isRtl ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              resetForm();
            }}
            disabled={modalLoading}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleUpdateUser} loading={modalLoading}>
            {isRtl ? 'حفظ' : 'Save'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedUser(null);
          setNewPassword('');
        }}
        title={isRtl ? 'تغيير كلمة المرور' : 'Change Password'}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {isRtl
              ? `تغيير كلمة المرور للمستخدم: ${selectedUser?.name}`
              : `Change password for: ${selectedUser?.name}`}
          </p>
          <Input
            label={isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            hint={isRtl ? '8 أحرف على الأقل' : 'At least 8 characters'}
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPasswordModal(false);
              setSelectedUser(null);
              setNewPassword('');
            }}
            disabled={modalLoading}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleChangePassword} loading={modalLoading}>
            {isRtl ? 'تغيير' : 'Change'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title={isRtl ? 'حذف المستخدم' : 'Delete User'}
        description={
          isRtl
            ? `هل أنت متأكد من حذف المستخدم "${selectedUser?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`
        }
        confirmLabel={isRtl ? 'حذف' : 'Delete'}
        cancelLabel={isRtl ? 'إلغاء' : 'Cancel'}
        variant="danger"
        loading={modalLoading}
      />
    </div>
  );
}
