import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type Props = {
  clientName: string;
  teacherName: string;
  startTimeFormatted: string;
  durationMinutes: number;
  meetLink: string | null;
  manageUrl: string;
  appUrl: string;
};

export default function Reminder24h({
  clientName,
  teacherName,
  startTimeFormatted,
  durationMinutes,
  meetLink,
  manageUrl,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: lesson with {teacherName} tomorrow</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reminder: lesson in 24 hours</Heading>
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>
            This is a reminder that your lesson with <strong>{teacherName}</strong> is in 24 hours.
          </Text>
          <Section style={details}>
            <Text style={label}>When</Text>
            <Text style={value}>{startTimeFormatted}</Text>
            <Text style={label}>Duration</Text>
            <Text style={value}>{durationMinutes} minutes</Text>
          </Section>
          {meetLink && (
            <Section style={buttonSection}>
              <Link href={meetLink} style={button}>
                Join video call
              </Link>
            </Section>
          )}
          <Text style={small}>
            <Link href={manageUrl} style={link}>Manage or cancel</Link>
            {" · "}
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
const details = { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px", margin: "24px 0" };
const label = { fontSize: "12px", color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase" as const };
const value = { fontSize: "16px", color: "#111", margin: "0 0 12px" };
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
