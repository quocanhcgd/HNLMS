"use client";

import { useState } from "react";
import { Alert, Button, Checkbox, Paper, Select, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";

const interests = [
  { value: "ielts", label: "IELTS" },
  { value: "communication", label: "Tiếng Anh giao tiếp" },
  { value: "teen", label: "Tiếng Anh thiếu niên" },
  { value: "other", label: "Chương trình khác" },
];

type SubmissionState = "idle" | "submitting" | "success" | "error";

function submissionKey(): string {
  return crypto.randomUUID();
}

export function ConsultationForm() {
  const [state, setState] = useState<SubmissionState>("idle");
  const [error, setError] = useState<string>();
  const [key, setKey] = useState(submissionKey);

  async function submit(form: HTMLFormElement) {
    const fields = new FormData(form);
    const consent = fields.get("consent") === "on";
    if (!consent) {
      setError("Bạn cần đồng ý để chúng tôi lưu thông tin và liên hệ tư vấn.");
      return;
    }

    setState("submitting");
    setError(undefined);
    const response = await fetch("/api/public/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fields.get("fullName"),
        phone: fields.get("phone"),
        email: fields.get("email") || undefined,
        interest: fields.get("interest"),
        message: fields.get("message") || undefined,
        source: "public-consultation-form",
        consent,
        client_submission_key: fields.get("submissionKey"),
      }),
    }).catch(() => undefined);

    if (!response?.ok) {
      setState("error");
      setError("Chưa thể gửi yêu cầu. Vui lòng thử lại trong ít phút hoặc gọi cho chúng tôi.");
      return;
    }

    setState("success");
    form.reset();
    setKey(submissionKey());
  }

  if (state === "success") {
    return (
      <Paper className="consultationCard" p={{ base: "lg", sm: "xl" }} radius="md" withBorder aria-live="polite">
        <Text c="cyan.4" fw={700} tt="uppercase" size="sm">
          Đã nhận yêu cầu
        </Text>
        <Title order={2} mt="xs">
          Cảm ơn bạn đã liên hệ.
        </Title>
        <Text c="dimmed" mt="sm">
          Đội ngũ Hanoi Learning sẽ liên hệ trong giờ làm việc gần nhất để trao đổi về lộ trình phù hợp.
        </Text>
        <Button
          mt="xl"
          variant="light"
          onClick={() => {
            setKey(submissionKey());
            setState("idle");
          }}
        >
          Gửi một yêu cầu khác
        </Button>
      </Paper>
    );
  }

  return (
    <Paper className="consultationCard" p={{ base: "lg", sm: "xl" }} radius="md" withBorder>
      <Stack
        gap="md"
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event.currentTarget);
        }}
      >
        <input type="hidden" name="submissionKey" value={key} />
        <div>
          <Text c="cyan.4" fw={700} tt="uppercase" size="sm">
            Bắt đầu từ hôm nay
          </Text>
          <Title order={2} mt="xs">
            Nhận tư vấn lộ trình
          </Title>
          <Text c="dimmed" mt="xs">
            Để lại thông tin, chúng tôi sẽ giúp bạn chọn chương trình và thời gian học phù hợp.
          </Text>
        </div>
        {error ? (
          <Alert color="red" title="Không thể gửi yêu cầu">
            {error}
          </Alert>
        ) : null}
        <TextInput name="fullName" label="Họ và tên" placeholder="Nguyễn Minh Anh" required autoComplete="name" />
        <TextInput
          name="phone"
          label="Số điện thoại"
          placeholder="090 123 4567"
          required
          type="tel"
          autoComplete="tel"
        />
        <TextInput name="email" label="Email" placeholder="ban@example.com" type="email" autoComplete="email" />
        <Select name="interest" label="Bạn quan tâm đến" placeholder="Chọn chương trình" data={interests} required />
        <Textarea
          name="message"
          label="Nhu cầu của bạn"
          placeholder="Mục tiêu học, thời gian mong muốn..."
          minRows={3}
          maxLength={2000}
        />
        <Checkbox
          name="consent"
          label="Tôi đồng ý để Hanoi Learning lưu thông tin và liên hệ tư vấn theo chính sách riêng tư."
          required
        />
        <Button type="submit" loading={state === "submitting"} size="md">
          Gửi yêu cầu tư vấn
        </Button>
      </Stack>
    </Paper>
  );
}
