import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    title: "소장 관리",
    description:
      "종이책·전자책을 한곳에 모아 읽기 상태, 평점, 메모를 남기고 언제든 목록을 확인하세요."
  },
  {
    title: "ISBN·바코드 검색",
    description:
      "구매 전에 이미 갖고 있는 책인지 ISBN 입력이나 바코드 스캔으로 빠르게 확인할 수 있습니다. (모바일에서 스캔)"
  },
  {
    title: "웹 · 모바일",
    description: "웹 대시보드와 Flutter 앱으로 동일한 서재를 어디서나 이어서 관리합니다."
  }
];

const steps = [
  { step: "1", title: "등록", body: "ISBN·바코드 또는 수동 입력으로 책을 추가합니다." },
  { step: "2", title: "상태", body: "읽는 중·완독 등 상태를 기록합니다." },
  { step: "3", title: "검색", body: "새 책 구매 시 소장 여부를 바로 조회합니다." }
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="rounded-full px-3">
              Personal library
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
              내가 가진 책을, 어디서든 Bookfolio로.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-pretty">
              소장 관리와 검색이 핵심입니다. 웹과 모바일에서 내 서재를 확인하고, ISBN이나 바코드로 이미
              있는 책인지 바로 찾아보세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/dashboard">내 서재 열기</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">로그인 · 가입</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">핵심</CardTitle>
                  <CardDescription>소장 관리 · 검색</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">UI</CardTitle>
                  <CardDescription>shadcn/ui 기반</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">인증</CardTitle>
                  <CardDescription>NextAuth · 이메일 · Google</CardDescription>
                </CardHeader>
              </Card>
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
                    <Badge variant="outline" className="mt-0.5 shrink-0 rounded-full">
                      {item.step}
                    </Badge>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.body}</p>
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

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="mb-10 text-3xl font-semibold tracking-tight">왜 Bookfolio인가</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/70">
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-pretty">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
