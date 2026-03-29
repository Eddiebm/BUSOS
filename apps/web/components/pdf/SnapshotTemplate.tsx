import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  formatValuePropositionSentence,
  type VentureSnapshotPayload,
} from "@/lib/venture-snapshot";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 11,
    color: "#444",
    marginBottom: 20,
  },
  section: { marginBottom: 16 },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 4,
  },
  body: { fontSize: 10, lineHeight: 1.45 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", paddingVertical: 4 },
  cell: { flex: 1, fontSize: 9, paddingRight: 4 },
  meta: { fontSize: 9, color: "#666", marginTop: 24 },
});

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type Props = { data: VentureSnapshotPayload };

export function SnapshotPdfDocument({ data }: Props) {
  const vpSentence = formatValuePropositionSentence(data.valueProposition);
  const inMvp = data.mvpFeatures.filter((f) => f.inMvp && f.text.trim());
  const future = data.mvpFeatures.filter((f) => !f.inMvp && f.text.trim());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.ventureName}</Text>
        {data.ventureDescription ? (
          <Text style={styles.subtitle}>{data.ventureDescription}</Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.h2}>Progress</Text>
          <Text style={styles.body}>
            {data.completedMilestones} of {data.totalMilestones} milestones completed
          </Text>
        </View>

        {vpSentence ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Value proposition</Text>
            <Text style={styles.body}>{vpSentence}</Text>
          </View>
        ) : null}

        {data.competitors.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Competitive landscape</Text>
            <View style={{ ...styles.row, fontFamily: "Helvetica-Bold" }}>
              <Text style={styles.cell}>Competitor</Text>
              <Text style={styles.cell}>Pricing</Text>
              <Text style={styles.cell}>Strengths</Text>
              <Text style={styles.cell}>Weaknesses</Text>
            </View>
            {data.competitors.map((c, i) => (
              <View key={i} style={styles.row} wrap={false}>
                <Text style={styles.cell}>{c.name || "—"}</Text>
                <Text style={styles.cell}>{c.pricing || "—"}</Text>
                <Text style={styles.cell}>{c.strengths || "—"}</Text>
                <Text style={styles.cell}>{c.weaknesses || "—"}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.mvpFeatures.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.h2}>MVP scope</Text>
            <Text style={{ ...styles.body, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
              In MVP
            </Text>
            {inMvp.map((f, i) => (
              <Text key={`m-${i}`} style={styles.body}>
                • {f.text}
              </Text>
            ))}
            <Text style={{ ...styles.body, fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 4 }}>
              Future
            </Text>
            {future.length > 0 ? (
              future.map((f, i) => (
                <Text key={`f-${i}`} style={styles.body}>
                  • {f.text}
                </Text>
              ))
            ) : (
              <Text style={styles.body}>—</Text>
            )}
          </View>
        ) : null}

        {data.financialModel ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Financial model</Text>
            <Text style={styles.body}>
              Revenue per user: {fmtMoney(data.financialModel.revenuePerUser)} · Growth:{" "}
              {data.financialModel.monthlyGrowthPct}% · COGS: {data.financialModel.cogsPct}% · Fixed:{" "}
              {fmtMoney(data.financialModel.fixedMonthlyCosts)}/mo · Starting users:{" "}
              {fmtMoney(data.financialModel.startingUsers)}
            </Text>
            {data.financialSummary ? (
              <Text style={{ ...styles.body, marginTop: 6 }}>
                Year 1 revenue (sum): {fmtMoney(data.financialSummary.yearOneRevenue)} · Year 1 net profit
                (sum): {fmtMoney(data.financialSummary.yearOneNetProfit)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {data.team.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Team</Text>
            {data.team.map((t, i) => (
              <Text key={i} style={styles.body}>
                {t.name} — {t.role}
              </Text>
            ))}
          </View>
        ) : null}

        {data.dna && Object.keys(data.dna).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Venture DNA (summary)</Text>
            <Text style={styles.body}>
              {String((data.dna as { dreamStatement?: string }).dreamStatement ?? "").slice(0, 500)}
            </Text>
          </View>
        ) : null}

        <Text style={styles.meta}>BUSOS Venture Snapshot · Generated for planning and sharing</Text>
      </Page>
    </Document>
  );
}
