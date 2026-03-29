import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ImplementedFeatureCard = {
  title: string;
  description: string;
  footerLink?: { href: "/dashboard/bookfolio-aggregate"; label: string };
};

/** 지금 서비스에서 이용할 수 있는 기능(랜딩 요약). */
const implementedFeatures: ImplementedFeatureCard[] = [
  {
    title: "소장 관리",
    description:
      "종이책·전자책을 한곳에 모아 읽기 상태, 평점, 메모를 남기고 목록을 확인합니다.",
  },
  {
    title: "ISBN·바코드 검색",
    description:
      "ISBN 입력 또는 휴대폰에서 바코드 스캔으로 소장 여부와 도서 정보를 빠르게 확인합니다.",
  },
  {
    title: "웹·휴대폰 연동",
    description:
      "웹 대시보드와 휴대폰 앱에서 같은 계정으로 서재를 이어서 봅니다.",
  },
  {
    title: "로그인",
    description: "이메일·비밀번호와 Google 계정으로 가입·로그인할 수 있습니다.",
  },
  {
    title: "공동서재",
    description:
      "다른 회원을 초대해 함께 도서 목록을 관리하는 공용 서재를 만들 수 있습니다. 초대·한도·정책은 서비스 규칙을 따릅니다.",
  },
  {
    title: "Bookfolio 집계",
    description:
      "소장·완독·포인트 순위와 서비스 전반에서 많이 소장된 책 요약을 웹·앱에서 볼 수 있습니다. 앱에서는 목록을 당겨 새로 고침할 수 있습니다.",
    footerLink: {
      href: "/dashboard/bookfolio-aggregate",
      label: "웹에서 집계 화면 열기",
    },
  },
  {
    title: "포인트·VIP",
    description:
      "활동에 따라 포인트가 적립되고, 일부 확장 기능 이용 시 차감될 수 있습니다. 휴대폰 앱 프로필에서 잔액과 VIP 표시를 확인할 수 있습니다.",
  },
  {
    title: "휴대폰 앱 허브·설정",
    description:
      "상단 메뉴에서 공동서재, Bookfolio 집계, 베스트셀러, 초이스 신간, 내 서재로 이동합니다. 프로필에서 화면 모드(시스템·밝게·어둡게)와 색 톤(웜·세이지)을 고르면 기기에 저장됩니다.",
  },
  {
    title: "웹 대시보드",
    description:
      "내 서재 편집, 공동서재, 포인트·초대·한도 등 계정·서재 관리를 브라우저에서 합니다.",
  },
];

/** 프로젝트 계획(`.cursor/rules/project-plan.mdc` 등) 기준, 아직 제공하지 않거나 확장 예정인 영역. */
const upcomingFeatures = [
  {
    title: "모임서재",
    description:
      "독서 모임·스터디가 함께 읽을 책과 진행을 한곳에 모으는 공용 서재를, 지금의 공동서재를 모임 맥락에 맞게 넓히는 방향으로 준비합니다.",
  },
  {
    title: "개인 서재·메타데이터 확장",
    description:
      "표지·메타 보강, 서가·태그·카테고리, 위시리스트, 대출 이력 등 개인 서재를 더 풍부게 정리하는 기능을 검토합니다.",
  },
  {
    title: "독서 관리·목표·알림",
    description:
      "시작·완독일, 읽기 목표, 독서 일지, 재독, 연속 기록과 ‘다음에 읽을 책’ 같은 알림·리마인더를 단계적으로 더합니다.",
  },
  {
    title: "리뷰·노트 고도화",
    description:
      "구조화된 리뷰, 인용·하이라이트, 스포일러 처리, 초안·수정 이력 등 기록 방식을 깊게 가져갈 계획입니다.",
  },
  {
    title: "통계·인사이트 강화",
    description:
      "연·월별 완독, 평점 추이, 장르·형식 비율, 패턴 분석 등 개인 대시보드와 기록 뷰를 Bookfolio 집계와 함께 확장합니다.",
  },
  {
    title: "커뮤니티·소셜",
    description:
      "공개 리뷰, 팔로우, 좋아요·댓글, 피드 등 서로의 독서를 나누는 경험을 로드맵에 두고 있습니다.",
  },
  {
    title: "발견·추천·큐레이션",
    description:
      "개인화 추천, 큐레이션, 트렌딩 도서 등 ‘다음 책 찾기’를 돕는 기능을 구상 중입니다.",
  },
  {
    title: "플랫폼 보강",
    description:
      "푸시 알림, 운영·분석, 검색·스테이징 등 서비스 전반 인프라를 다듬어 갈 예정입니다.",
  },
  {
    title: "결제 연동·VIP 자동화",
    description:
      "결제 모듈(PG) 도입 후 구독·갱신·해지가 데이터베이스와 자동으로 맞물리도록 연계합니다. 그 전까지는 운영 정책에 따른 수동·대시보드 운영을 병행합니다.",
  },
  {
    title: "ISBN 조회 맞춤 설정",
    description:
      "국립중앙도서관·네이버 간 조회 우선순위를 회원 설정으로 바꿀 수 있게 하는 방향을 검토 중입니다.",
  },
];

const steps = [
  {
    step: "1",
    title: "등록",
    body: "ISBN·바코드 또는 수동 입력으로 책을 추가합니다.",
  },
  { step: "2", title: "상태", body: "읽는 중·완독 등 상태를 기록합니다." },
  {
    step: "3",
    title: "검색",
    body: "새 책 구매 시 소장 여부를 바로 조회합니다.",
  },
];

/**
 * 공개 랜딩(홈) 페이지.
 *
 * @history
 * - 2026-03-28: 계획 카드에서 Google Books 조회 언급 제거(미도입).
 * - 2026-03-28: 구현 기능·계획 기능 섹션 분리; 「왜 Bookfolio인가」에 구현 목록만 통합.
 * - 2026-03-28: iOS 앱 순서 안내 패널 추가; 랜딩문구에서 스택·개발자용 표현 제거.
 * - 2026-03-28: 「왜 Bookfolio인가」 이후 최근 기능(모바일·웹) 소개 패널 추가.
 * - 2026-03-28: 포인트·혜택 정책 요약 패널 추가(비회원·회원 안내, 이용약관 링크).
 * - 2026-03-29: 상단 서비스 소개 패널 추가(Book+Portfolio); 미니 3카드 제거; 상표는 영문 Bookfolio만 사용.
 */
export default function HomePage() {
  return (
    <main>
      <section
        className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:pt-24 md:pb-10"
        aria-labelledby="bookfolio-intro-heading"
      >
        <Card className="border-border/80 bg-muted/25 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle
              id="bookfolio-intro-heading"
              className="text-xl md:text-2xl"
            >
              Bookfolio를 소개합니다
            </CardTitle>
            <CardDescription className="text-pretty text-base">
              서비스 이름은{" "}
              <strong className="font-medium text-foreground">Bookfolio</strong>{" "}
              <span className="font-medium text-foreground">Book</span>과{" "}
              <span className="font-medium text-foreground">Portfolio</span>를
              잇는 말로, 내가 소장한 책과 읽기·감상 기록을 한곳에 모아 두는{" "}
              <strong className="font-medium text-foreground">
                나만의 서재 창고
              </strong>
              같은 역할을 합니다. 동시에 기록과 목록을{" "}
              <strong className="font-medium text-foreground">
                공유하고 다른 사람과 나누는
              </strong>{" "}
              경험까지 이어 가도록 설계된 플랫폼입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8 lg:items-center">
              <img
                src="/assets/bookfolio_b_favicon.svg"
                alt=""
                width={176}
                height={176}
                className="size-32 shrink-0 sm:size-36 md:size-40 lg:size-44"
              />
              <div className="min-w-0 space-y-6 text-center sm:flex-1 sm:text-left">
                <Badge variant="secondary" className="rounded-full px-3">
                  개인 서재
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
                  <span className="block">내가 가진 책을,</span>
                  <span className="block">어디서든 Bookfolio로.</span>
                </h1>
              </div>
            </div>
            <p className="max-w-xl text-lg text-muted-foreground text-pretty">
              소장 관리와 검색이 핵심입니다. 웹과 모바일에서 내 서재를 확인하고,
              ISBN이나 바코드로 이미 있는 책인지 바로 찾아보세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/dashboard">내 서재 열기</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">로그인 · 가입</Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/80 shadow-xl">
            <CardHeader>
              <CardTitle>사용 흐름</CardTitle>
              <CardDescription>등록 → 기록 → 구매 전 확인</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((item, i) => (
                <div key={item.step}>
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className="mt-0.5 shrink-0 rounded-full"
                    >
                      {item.step}
                    </Badge>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </div>
                  {i < steps.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="opacity-50" />

      <section
        className="mx-auto max-w-6xl px-4 py-12 md:py-16"
        aria-labelledby="points-policy-heading"
      >
        <Card className="border-border/80 bg-muted/25 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle
              id="points-policy-heading"
              className="text-xl md:text-2xl"
            >
              포인트·혜택 안내
            </CardTitle>
            <CardDescription className="text-pretty text-base">
              가입 여부에 따라 포인트가 어떻게 적용되는지 요약했습니다. 세부
              조건은 운영 정책·약관을 따릅니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-8 md:grid-cols-2 md:gap-10">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="font-normal text-muted-foreground"
                >
                  비회원 · 둘러보기
                </Badge>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground text-pretty">
                  <li>
                    포인트는{" "}
                    <strong className="font-medium text-foreground">
                      로그인한 회원
                    </strong>
                    에게만 적용되는 서비스 내부 혜택이며, 가입 후 이용할 수
                    있습니다.
                  </li>
                  <li>
                    비회원에게는 포인트 잔액이 없으며, 소장 관리·적립·차감은
                    회원 계정과 연결됩니다.
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="font-normal text-muted-foreground"
                >
                  회원 · 로그인
                </Badge>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground text-pretty">
                  <li>
                    서재 활동 등에 따라 운영 정책에서 정한 대로 포인트가{" "}
                    <strong className="font-medium text-foreground">
                      적립
                    </strong>
                    되거나, 테마·공동서재 확장 등 일부 기능 이용 시{" "}
                    <strong className="font-medium text-foreground">
                      차감
                    </strong>
                    될 수 있습니다. 잔액이 부족하면 해당 기능 이용이 제한될 수
                    있습니다.
                  </li>
                  <li>
                    포인트는 현금·화폐가치와 교환되지 않으며, 적립·차감·소멸
                    조건은 변경될 수 있습니다. 운영·오류 정정 등으로 조정될 수
                    있습니다.
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-pretty">
              자세한 내용은{" "}
              <Link
                href="/terms"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                이용약관
              </Link>
              의 포인트·혜택·VIP·구독·한도 조항을 참고해 주세요.
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 py-16 md:py-20"
        aria-labelledby="why-bookfolio-heading"
      >
        <h2
          id="why-bookfolio-heading"
          className="mb-4 text-3xl font-semibold tracking-tight"
        >
          왜 Bookfolio인가
        </h2>
        <p className="mb-10 max-w-3xl text-muted-foreground text-pretty md:text-lg">
          지금 가입하거나 앱을 쓰면 바로 이용할 수 있는 기능입니다. 아래 목록은
          현재 구현·운영 중인 범위를 기준으로 정리했습니다.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {implementedFeatures.map((feature) => (
            <Card key={feature.title} className="border-border/70">
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-pretty">
                  {feature.description}
                </CardDescription>
                {feature.footerLink ? (
                  <p className="pt-2">
                    <Link
                      href={feature.footerLink.href}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {feature.footerLink.label}
                    </Link>
                  </p>
                ) : null}
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card
          className="mt-10 border-border/80 bg-muted/35 shadow-sm"
          aria-labelledby="ios-notice-heading"
        >
          <CardHeader className="pb-2">
            <CardTitle
              id="ios-notice-heading"
              className="text-base font-semibold md:text-lg"
            >
              아이폰(iOS) 앱을 기다려 주시는 분께
            </CardTitle>
            <CardDescription className="text-pretty text-base">
              안드로이드 앱 서비스를 어느 정도 다듬고 안정시킨 뒤,{" "}
              <strong className="font-medium text-foreground">아이폰 앱</strong>
              도 순서대로 준비할 예정입니다. 늦어지는 부분은 너그럽게 양해해
              주시면 감사하겠습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground text-pretty">
            <p>
              그동안 같은 서재는{" "}
              <strong className="font-medium text-foreground">
                웹 브라우저
              </strong>
              와{" "}
              <strong className="font-medium text-foreground">
                안드로이드
              </strong>
              기기에서 동일한 계정으로 이용하실 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="opacity-50" />

      <section
        className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:pb-24 md:pt-8"
        aria-labelledby="upcoming-features-heading"
      >
        <h2
          id="upcoming-features-heading"
          className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl"
        >
          앞으로 추가될 기능들
        </h2>
        <p className="mb-10 max-w-3xl text-muted-foreground text-pretty md:text-lg">
          아래는 계획 문서·로드맵에 적혀 있으나 아직 제공하지 않거나, 단계적으로
          넓혀 갈 영역입니다. 시기·범위는 변경될 수 있습니다.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingFeatures.map((feature) => (
            <Card
              key={feature.title}
              className="border border-dashed border-border/70 bg-card/40"
            >
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-pretty">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
