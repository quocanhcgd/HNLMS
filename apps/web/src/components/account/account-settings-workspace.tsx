"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Divider, Group, Paper, PasswordInput, Select, SimpleGrid, Stack, Tabs, Text, TextInput } from "@mantine/core";
import { Check, KeyRound, Mail, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiModal } from "@/components/ui";
import { useUI } from "@/lib/providers";
import {
  changeDemoPassword,
  getDemoPreferences,
  getDemoProfile,
  readDemoSession,
  saveDemoPreferences,
  saveDemoProfile,
  updateDemoSessionProfile,
  type DemoPreferences,
  type DemoProfile,
} from "@/lib/demo-auth";

type AccountWorkspace = "admin" | "teacher" | "student" | "parent";

const workspaceLabels: Record<AccountWorkspace, string> = {
  admin: "Vận hành tổ chức",
  teacher: "Giảng dạy",
  student: "Học tập",
  parent: "Theo dõi gia đình",
};

const emptyProfile: DemoProfile = { displayName: "", email: "", phone: "", timezone: "Asia/Ho_Chi_Minh", department: "" };
const defaultPreferences: DemoPreferences = {
  locale: "vi",
  emailAlerts: true,
  reminders: true,
  assignmentAlerts: true,
  classChangeAlerts: true,
  centerNews: false,
};

export function AccountSettingsWorkspace({ workspace }: { workspace: AccountWorkspace }) {
  const { locale, setLocale } = useUI();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<DemoProfile>(emptyProfile);
  const [preferences, setPreferences] = useState<DemoPreferences>(defaultPreferences);
  const [profileDraft, setProfileDraft] = useState<DemoProfile>(emptyProfile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = readDemoSession();
    const accountEmail = session?.email ?? "";
    const savedProfile = getDemoProfile(accountEmail);
    setEmail(accountEmail);
    setProfile(savedProfile);
    setProfileDraft(savedProfile);
    setPreferences(getDemoPreferences(accountEmail));
    const hash = window.location.hash.replace("#", "");
    if (["profile", "preferences", "security"].includes(hash)) setActiveTab(hash);
    const syncHash = () => {
      const nextHash = window.location.hash.replace("#", "");
      if (["profile", "preferences", "security"].includes(nextHash)) setActiveTab(nextHash);
    };
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const changeTab = (value: string | null) => {
    if (!value) return;
    setActiveTab(value);
    window.history.replaceState(null, "", `${window.location.pathname}#${value}`);
  };

  const updatePreference = (key: keyof DemoPreferences, value: boolean | string) => {
    const next = { ...preferences, [key]: value } as DemoPreferences;
    setPreferences(next);
    if (email) saveDemoPreferences(email, next);
    if (key === "locale" && (value === "vi" || value === "en")) setLocale(value);
    setNotice("Đã lưu tùy chọn tài khoản.");
  };

  const openProfile = () => {
    setProfileDraft(profile);
    setError("");
    setNotice("");
    setProfileOpen(true);
  };

  const saveProfile = () => {
    if (!profileDraft.displayName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    const next = { ...profileDraft, displayName: profileDraft.displayName.trim() };
    saveDemoProfile(email, next);
    updateDemoSessionProfile(next);
    setProfile(next);
    setProfileOpen(false);
    setNotice("Đã cập nhật hồ sơ cá nhân.");
  };

  const savePassword = () => {
    setError("");
    if (nextPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    const result = changeDemoPassword(email, currentPassword, nextPassword);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setPasswordOpen(false);
    setNotice("Đã đổi mật khẩu. Mật khẩu mới được áp dụng cho lần đăng nhập tiếp theo.");
  };

  return (
    <div className={`page ${workspace}Workspace`}>
      <PageHeader title="Tài khoản cá nhân" subtitle="Quản lý hồ sơ, thông báo và bảo mật trong mọi không gian HN LMS." />
      {notice ? <Alert color="teal" icon={<Check size={16} />} mb="md">{notice}</Alert> : null}
      <Tabs value={activeTab} onChange={changeTab}>
        <Tabs.List>
          <Tabs.Tab value="profile" leftSection={<UserRound size={16} />}>Hồ sơ cá nhân</Tabs.Tab>
          <Tabs.Tab value="preferences" leftSection={<ShieldCheck size={16} />}>Tùy chọn</Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<KeyRound size={16} />}>Bảo mật</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile" pt="lg">
          <Paper className="panel" p="lg" withBorder>
            <Group justify="space-between" align="flex-start" mb="lg">
              <Group gap="sm" wrap="nowrap">
                <div className="brandMark">{profile.displayName.slice(0, 2).toUpperCase() || "HN"}</div>
                <div>
                  <Text fw={700}>{profile.displayName || "Người dùng HN LMS"}</Text>
                  <Text size="sm" c="dimmed">{workspaceLabels[workspace]}</Text>
                </div>
              </Group>
              <UiButton leftSection={<Pencil size={16} />} onClick={openProfile}>Chỉnh sửa hồ sơ</UiButton>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <ReadOnlyField label="Email đăng nhập" value={profile.email || email} icon={<Mail size={16} />} />
              <ReadOnlyField label="Vai trò trong hệ thống" value={workspaceLabels[workspace]} />
              <ReadOnlyField label="Số điện thoại" value={profile.phone || "Chưa cập nhật"} />
              <ReadOnlyField label="Múi giờ" value={profile.timezone} />
              <ReadOnlyField label="Bộ phận / phạm vi" value={profile.department || "Theo phân quyền tài khoản"} />
            </SimpleGrid>
            <Divider my="lg" />
            <Text size="sm" c="dimmed">Email và quyền truy cập do quản trị viên quản lý. Thay đổi hồ sơ chỉ cập nhật thông tin hiển thị trong lớp học, trao đổi và thông báo.</Text>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="preferences" pt="lg">
          <Paper className="panel" p="lg" withBorder maw={820}>
            <Text fw={700}>Tùy chọn hiển thị và thông báo</Text>
            <Text size="sm" c="dimmed" mt="xs" mb="lg">Thay đổi được lưu tự động theo tài khoản và dùng chung trên các thiết bị demo.</Text>
            <Stack gap="md">
              <Select label="Ngôn ngữ hiển thị" value={preferences.locale || locale} onChange={(value) => value && updatePreference("locale", value)} data={[{ value: "vi", label: "Tiếng Việt" }, { value: "en", label: "English" }]} />
              <PreferenceToggle label="Nhận thông báo qua email" checked={preferences.emailAlerts} onChange={(value) => updatePreference("emailAlerts", value)} />
              <PreferenceToggle label="Nhắc lịch học, lịch dạy và lịch hẹn sắp tới" checked={preferences.reminders} onChange={(value) => updatePreference("reminders", value)} />
              <PreferenceToggle label="Thông báo bài tập, điểm và phản hồi mới" checked={preferences.assignmentAlerts} onChange={(value) => updatePreference("assignmentAlerts", value)} />
              <PreferenceToggle label="Thông báo thay đổi lớp hoặc lịch học" checked={preferences.classChangeAlerts} onChange={(value) => updatePreference("classChangeAlerts", value)} />
              <PreferenceToggle label="Tin tức và ưu đãi từ trung tâm" checked={preferences.centerNews} onChange={(value) => updatePreference("centerNews", value)} />
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="security" pt="lg">
          <Paper className="panel" p="lg" withBorder maw={820}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={700}>Mật khẩu đăng nhập</Text>
                <Text size="sm" c="dimmed" mt="xs">Đổi mật khẩu định kỳ để bảo vệ hồ sơ và dữ liệu học tập.</Text>
              </div>
              <Badge color="teal" variant="light">Đang bảo vệ</Badge>
            </Group>
            <Divider my="lg" />
            <Group justify="space-between" align="center">
              <Group gap="sm"><KeyRound size={20} /><div><Text fw={600}>Mật khẩu hiện tại</Text><Text size="sm" c="dimmed">Không hiển thị vì lý do bảo mật.</Text></div></Group>
              <UiButton variant="default" onClick={() => { setError(""); setPasswordOpen(true); }}>Đổi mật khẩu</UiButton>
            </Group>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <UiModal opened={profileOpen} onClose={() => setProfileOpen(false)} title="Chỉnh sửa hồ sơ cá nhân">
        <Stack>
          {error ? <Alert color="red">{error}</Alert> : null}
          <TextInput label="Họ và tên" value={profileDraft.displayName} onChange={(event) => setProfileDraft({ ...profileDraft, displayName: event.currentTarget.value })} required />
          <TextInput label="Email đăng nhập" value={profileDraft.email || email} readOnly description="Email do quản trị viên quản lý." />
          <TextInput label="Số điện thoại" value={profileDraft.phone} onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.currentTarget.value })} />
          <Select label="Múi giờ" value={profileDraft.timezone} onChange={(value) => value && setProfileDraft({ ...profileDraft, timezone: value })} data={["Asia/Ho_Chi_Minh", "Asia/Bangkok", "UTC"]} />
          <Group justify="flex-end"><UiButton variant="default" onClick={() => setProfileOpen(false)}>Hủy</UiButton><UiButton onClick={saveProfile}>Lưu hồ sơ</UiButton></Group>
        </Stack>
      </UiModal>

      <UiModal opened={passwordOpen} onClose={() => setPasswordOpen(false)} title="Đổi mật khẩu">
        <Stack>
          {error ? <Alert color="red">{error}</Alert> : null}
          <PasswordInput label="Mật khẩu hiện tại" value={currentPassword} onChange={(event) => setCurrentPassword(event.currentTarget.value)} required autoComplete="current-password" />
          <PasswordInput label="Mật khẩu mới" description="Tối thiểu 8 ký tự." value={nextPassword} onChange={(event) => setNextPassword(event.currentTarget.value)} required autoComplete="new-password" />
          <PasswordInput label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(event) => setConfirmPassword(event.currentTarget.value)} required autoComplete="new-password" />
          <Group justify="flex-end"><UiButton variant="default" onClick={() => setPasswordOpen(false)}>Hủy</UiButton><UiButton onClick={savePassword} disabled={!currentPassword || !nextPassword || !confirmPassword}>Cập nhật mật khẩu</UiButton></Group>
        </Stack>
      </UiModal>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div><Text size="xs" c="dimmed" mb={4}>{label}</Text><Group gap="xs" wrap="nowrap">{icon}{<Text fw={600}>{value}</Text>}</Group></div>;
}

function PreferenceToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="accountPreference"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} /><span>{label}</span></label>;
}
