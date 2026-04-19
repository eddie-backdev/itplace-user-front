import React, { useState, useEffect } from 'react';
import { getPartnersSearchRanking, PartnerSearchRankingItem } from '../apis/allBenefitsApi';

// 로컬 RankingItem 타입 정의
interface RankingItem {
  partnerName: string;
  searchCount: number;
  trend: 'up' | 'down' | 'keep';
  rankChange: number;
}

// API 응답을 RankingItem으로 변환하는 함수
const convertToRankingItem = (apiData: PartnerSearchRankingItem[]): RankingItem[] => {
  return apiData.map((item) => {
    let trend: 'up' | 'down' | 'keep' = 'keep';

    // API 응답의 changeDerection 필드를 기반으로 트렌드 설정
    switch (item.changeDerection) {
      case 'UP':
        trend = 'up';
        break;
      case 'DOWN':
        trend = 'down';
        break;
      case 'SAME':
      case 'NEW':
      default:
        trend = 'keep';
        break;
    }

    return {
      partnerName: item.partnerName,
      searchCount: item.searchCount,
      trend: trend,
      rankChange: item.rankChange,
    };
  });
};

interface SimpleRankingProps {
  className?: string;
}

const SimpleRanking: React.FC<SimpleRankingProps> = ({ className = '' }) => {
  const [data, setData] = useState<RankingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 모바일 슬라이드용
  const title = '지금 많이 검색되고 있어요 !';

  useEffect(() => {
    const fetchRankingData = async () => {
      try {
        // 제휴처 검색 순위 데이터 조회 (최근 2일, 이전 3일 기준으로 상위 3개)
        const searchRankingResponse = await getPartnersSearchRanking(2, 3);
        const searchRankingItems = convertToRankingItem(searchRankingResponse.data.slice(0, 3));
        setData(searchRankingItems);
      } catch (error) {
        console.error('제휴처 검색 순위 조회 실패', error);
        setData([]);
      }
    };

    fetchRankingData();
  }, []);

  // 모바일에서만 슬라이드(롤링) 동작
  useEffect(() => {
    if (data.length <= 1) return;
    // matchMedia로 모바일(max-md) 여부 체크
    const mq = window.matchMedia('(max-width: 768px)');
    if (!mq.matches) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 2500); // 2.5초마다 변경
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div
      className={`w-full rounded-[24px] bg-orange01 px-5 py-5 shadow-[0_18px_40px_rgba(251,146,60,0.18)] md:px-6 md:py-6 max-md:rounded-[20px] max-md:shadow-none ${className}`}
    >
      <div className="hidden md:grid md:grid-cols-[minmax(180px,220px)_repeat(3,minmax(0,1fr))] md:items-stretch md:gap-3">
        <div className="flex flex-col justify-center">
          <p className="text-body-4 font-medium text-orange04">검색 랭킹</p>
          <h3 className="mt-1 text-title-5 font-semibold text-black">{title}</h3>
          <p className="mt-2 text-body-4 text-grey05">상위 제휴처만 빠르게 확인해보세요.</p>
        </div>

        {data.length > 0 ? (
          data.map((item, index) => (
            <div
              key={index}
              className="flex min-h-[116px] flex-col justify-between rounded-[20px] bg-white/75 px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-title-7 font-semibold text-orange04">{index + 1}</span>
                <div className="flex items-center gap-1 text-body-4 text-grey04">
                  <span
                    className={
                      item.trend === 'up'
                        ? 'text-orange04'
                        : item.trend === 'down'
                          ? 'text-grey03'
                          : 'text-grey03'
                    }
                  >
                    {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '-'}
                  </span>
                  <span>{Math.abs(item.rankChange)}</span>
                </div>
              </div>
              <div>
                <p className="line-clamp-2 text-body-2 font-medium text-black">
                  {item.partnerName}
                </p>
                <p className="mt-2 text-body-4 text-grey05">
                  검색 {item.searchCount.toLocaleString()}회
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 flex min-h-[116px] items-center justify-center rounded-[20px] bg-white/60 px-4 text-body-3 text-grey05">
            아직 집계된 검색 랭킹이 없어요.
          </div>
        )}
      </div>

      <div className="md:hidden">
        <div className="mb-4">
          <p className="text-body-4 font-medium text-orange04">검색 랭킹</p>
          <h3 className="mt-1 text-title-6 font-semibold text-black">{title}</h3>
        </div>

        {data.length > 0 && (
          <div className="rounded-[18px] bg-white/70 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-title-8 text-orange04">{currentIndex + 1}</span>
                <span className="text-body-2 text-black">{data[currentIndex].partnerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-body-3 ${
                    data[currentIndex].trend === 'up' ? 'text-orange04' : 'text-grey03'
                  }`}
                >
                  {data[currentIndex].trend === 'up'
                    ? '▲'
                    : data[currentIndex].trend === 'down'
                      ? '▼'
                      : '-'}
                </span>
                <span className="text-body-3 text-grey04">
                  {Math.abs(data[currentIndex].rankChange)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-body-4 text-grey05">
              검색 {data[currentIndex].searchCount.toLocaleString()}회
            </p>
          </div>
        )}

        {data.length === 0 && (
          <div className="rounded-[18px] bg-white/60 px-4 py-4 text-body-3 text-grey05">
            아직 집계된 검색 랭킹이 없어요.
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleRanking;
