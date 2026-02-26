import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

type Props = {
  clientName: string;
  teacherName: string;
  startTimeFormatted: string;
  durationMinutes: number;
  appUrl: string;
};

export default function CancellationConfirmation({
  clientName,
  teacherName,
  startTimeFormatted,
  durationMinutes,
  appUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your lesson with {teacherName} was cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking cancelled</Heading>
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>
            Your lesson with <strong>{teacherName}</strong> on {startTimeFormatted} ({durationMinutes} min) has been cancelled.
          </Text>
          <Text style={text}>
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
const link = { color: "#111", textDecoration: "underline" };
