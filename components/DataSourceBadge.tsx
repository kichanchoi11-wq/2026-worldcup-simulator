import Badge from "@/components/Badge";
import type { DataSourceType } from "@/types/football";

const sourceTone: Record<DataSourceType, Parameters<typeof Badge>[0]["tone"]> = {
  "API 실제 데이터": "API 실제 데이터",
  "AI 예측 데이터": "AI 예측",
  "사용자 입력 데이터": "사용자 입력",
  "경우의 수 계산기 데이터": "경우의 수",
  "공식 출처 데이터": "공식",
  "확인 필요 데이터": "확인 필요"
};

export default function DataSourceBadge({ sourceType }: { sourceType: DataSourceType }) {
  const label = sourceType === "AI 예측 데이터" ? "AI 예측" : sourceType === "경우의 수 계산기 데이터" ? "경우의 수" : sourceType;
  return <Badge tone={sourceTone[sourceType]}>{label}</Badge>;
}
