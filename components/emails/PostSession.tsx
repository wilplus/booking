import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

type Props = {
  clientName: string;
  teacherName: string;
  startTimeFormatted: string;
  durationMinutes: number;
  message: string | null;
  paymentLink: string | null;
  appUrl: string;
};

export default function PostSession({
  clientName,
  teacherName,
  startTimeFormatted,
  durationMinutes,
  message,
  paymentLink,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Thanks for your lesson with {teacherName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks for your lesson</Heading>
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>
            Hope you enjoyed your lesson with <strong>{teacherName}</strong> ({startTimeFormatted}, {durationMinutes} min).
          </Text>
          {message && (
            <Section style={messageBox}>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}
          {paymentLink && (
            <Section style={buttonSection}>
              <Link href={paymentLink} style={button}>
                Pay for this session
              </Link>
            </Section>
          )}
          <Text style={small}>
            <Link href={appUrl} style={link}>Book another lesson</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "480px" };
const h1 = { fontSize: "20px", fontWeight: "600", color: "#111", marginBottom: "24px" };
const text = { fontSize: "16px", lineHeight: "24px", color: "#374151", margin: "0 0 12px" };
const messageBox = { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px", margin: "24px 0" };
const messageText = { fontSize: "15px", lineHeight: "22px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" as const };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: "#111",
  color: "#fff",
  textDecoration: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
};
const small = { fontSize: "12px", color: "#6b7280", margin: "4px 0" };
const link = { color: "#111", textDecoration: "underline" };
