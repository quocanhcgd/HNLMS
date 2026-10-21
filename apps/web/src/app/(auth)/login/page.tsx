"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Checkbox, Group, Paper, PasswordInput, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { ArrowRight, Eye, GraduationCap, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { DEMO_PASSWORD, demoAccounts, findDemoAccount, saveDemoSession, type DemoAccount } from "@/lib/demo-auth";

export default function LoginPage() {
  const router = useRouter();
  const [loggedOut, setLoggedOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoggedOut(new URLSearchParams(window.location.search).get("loggedOut") === "1");
  }, []);

  const selectedAccount = useMemo(() => demoAccounts.find((account) => account.email === email), [email]);

  const signIn = (account: DemoAccount, shouldRemember: boolean) => {
    saveDemoSession(account, shouldRemember);
    router.push(account.home);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const account = findDemoAccount(email, password);
    if (!account) {
      setError("Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại hoặc chọn một tài khoản demo bên dưới.");
      setLoading(false);
      return;
    }
    signIn(account, remember);
  };

  const fillAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <main className="loginPage">
      <section className="loginIntro">
        <Link href="/" className="loginBrand" aria-label="HN Learning home">
          <span className="brandMark">HN</span>
          <span>HN Learning</span>
        </Link>
        <div className="loginIntroContent">
          <Badge variant="light" color="cyan" leftSection={<ShieldCheck size={14} />}>
            Không gian đào tạo đa ngành
          </Badge>
          <Title order={1}>Một tài khoản cho mọi vai trò học tập.</Title>
          <Text c="dimmed" maw={490}>
            Đăng nhập để vào đúng không gian được phân quyền: vận hành, giảng dạy, học tập hoặc theo dõi kết quả của con.
          </Text>
          <Stack gap="sm" mt="xl">
            {[
              [GraduationCap, "Theo dõi xuyên suốt", "Từ mục tiêu đầu vào đến tiến độ và kết quả sau mỗi giai đoạn."],
              [LockKeyhole, "Quyền theo vai trò", "Mỗi cổng chỉ hiển thị dữ liệu và thao tác thuộc phạm vi được cấp."],
              [Eye, "Minh bạch trao đổi", "Lịch sử lớp học, phản hồi và thông báo được lưu cùng một hồ sơ."],
            ].map(([Icon, title, description]) => (
              <Group key={title as string} align="flex-start" wrap="nowrap" gap="sm">
                <ThemeIcon variant="light" color="cyan" size="lg"><Icon size={17} /></ThemeIcon>
                <div><Text fw={650}>{title as string}</Text><Text size="sm" c="dimmed">{description as string}</Text></div>
              </Group>
            ))}
          </Stack>
        </div>
        <Text size="xs" c="dimmed">© 2026 HN Learning · Phiên bản phát triển nội bộ</Text>
      </section>

      <section className="loginPanel" aria-labelledby="login-title">
        <Paper className="loginCard" withBorder shadow="sm" p={{ base: "lg", sm: 32 }}>
          <Stack gap="xs" mb="xl">
            <Text size="sm" c="cyan" fw={700}>CỔNG HN LMS</Text>
            <Title id="login-title" order={2}>Đăng nhập</Title>
            <Text size="sm" c="dimmed">Sử dụng email tổ chức để tiếp tục.</Text>
          </Stack>
          {loggedOut ? <Alert color="teal" mb="md">Bạn đã đăng xuất khỏi phiên hiện tại.</Alert> : null}
          {error ? <Alert color="red" mb="md">{error}</Alert> : null}
          <form onSubmit={submit}>
            <Stack gap="md">
              <TextInput label="Email" placeholder="ten@hnlms.vn" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required leftSection={<UserRound size={16} />} />
              <PasswordInput label="Mật khẩu" placeholder="Nhập mật khẩu" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required />
              <Group justify="space-between" align="center">
                <Checkbox label="Ghi nhớ trên thiết bị này" checked={remember} onChange={(event) => setRemember(event.currentTarget.checked)} />
                <Button variant="subtle" size="compact-sm" type="button" onClick={() => setError("Vui lòng liên hệ quản trị viên để cấp lại mật khẩu trong bản phát triển này.")}>Quên mật khẩu?</Button>
              </Group>
              <Button type="submit" loading={loading} rightSection={<ArrowRight size={16} />} fullWidth>Đăng nhập</Button>
            </Stack>
          </form>
          <div className="loginDivider"><span>hoặc kiểm tra nhanh</span></div>
          <Stack gap="xs">
            <Text size="xs" fw={700} c="dimmed">TÀI KHOẢN DEMO {selectedAccount ? `· ${selectedAccount.roleLabel}` : ""}</Text>
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
              {demoAccounts.map((account) => (
                <Button key={account.email} variant={selectedAccount?.email === account.email ? "light" : "default"} justify="flex-start" onClick={() => fillAccount(account)} leftSection={<UserRound size={15} />}>
                  <span className="loginDemoButtonText"><strong>{account.roleLabel}</strong><small>{account.email}</small></span>
                </Button>
              ))}
            </SimpleGrid>
            <Text size="xs" c="dimmed" mt="xs">Mật khẩu chung cho tài khoản demo: <strong>{DEMO_PASSWORD}</strong></Text>
          </Stack>
        </Paper>
      </section>
    </main>
  );
}
