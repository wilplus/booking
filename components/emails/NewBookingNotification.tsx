import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

type Props = {
  teacherName: string;
  clientName: string;
  clientEmail: string;
  startTimeFormatted: string;
  durationMinutes: number;
  adminBookingsUrl: string;
};

export default function NewBookingNotification({
  teacherName,
  clientName,
  clientEmail,
  startTimeFormatted,
  durationMinutes,
  adminBookingsUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New booking: {clientName} – {startTimeFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New booking</Heading>
          <Text style={text}>Hi {teacherName},</Text>
          <Text style={text}>
            <strong>{clientName}</strong> has booked a lesson.
          </Text>
          <Section style={details}>
            <Text style={label}>When</Text>
            <Text style={value}>{startTimeFormatted}</Text>
            <Text style={label}>Duration</Text>
            <Text style={value}>{durationMinutes} minutes</Text>
            <Text style={label}>Client email</Text>
            <Text style={value}>{clientEmail}</Text>
          </Section>
          <Text style={text}>
            <Link href={adminBookingsUrl} style={link}>View all bookings in admin</Link>
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
const link = { color: "#111", textDecoration: "underline" };
