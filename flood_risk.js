// 自動生成ファイル（scripts/check_flood_risk.py）。直接編集しないこと。
// 手動評価・被害実績は data/flood_risk_notes.json を編集して再生成する。
const floodRiskUpdatedAt = "2026/09/23";
const floodRiskData = {
  "layers": {
    "flood": {
      "label": "洪水（想定最大規模）",
      "kind": "depth"
    },
    "hanran": {
      "label": "家屋倒壊等氾濫想定区域（氾濫流）",
      "kind": "area"
    },
    "kagan": {
      "label": "家屋倒壊等氾濫想定区域（河岸侵食）",
      "kind": "area"
    },
    "hightide": {
      "label": "高潮（想定最大規模）",
      "kind": "depth"
    },
    "tsunami": {
      "label": "津波",
      "kind": "depth"
    },
    "naisui": {
      "label": "内水（下水があふれる浸水）",
      "kind": "depth"
    },
    "dosya": {
      "label": "土砂災害警戒区域",
      "kind": "area"
    }
  },
  "depth_labels": {
    "1": "0.5m未満（床下程度）",
    "2": "0.5〜3m（1階床上）",
    "3": "3〜5m（2階床上）",
    "4": "5〜10m（2階軒下以上）",
    "5": "10〜20m",
    "6": "20m以上"
  },
  "properties": {
    "千葉県千葉市稲毛区稲毛東３": {
      "level": "medium",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2026/08〜09",
          "text": "千葉市は2026年8月千葉豪雨（1時間115mm・12時間348mm）と台風25号の被害の中心。道路冠水・床上浸水が多数",
          "url": "https://tenki.jp/forecaster/s_ono/2026/08/14/40152.html"
        }
      ],
      "manual": {
        "level": "medium",
        "reason": "台地から京成稲毛方面へ下る斜面側",
        "date": "2026/09/23"
      }
    },
    "千葉県千葉市花見川区花園５": {
      "level": "medium",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2026/08〜09",
          "text": "千葉市は2026年8月千葉豪雨（1時間115mm・12時間348mm）と台風25号の被害の中心。道路冠水・床上浸水が多数",
          "url": "https://tenki.jp/forecaster/s_ono/2026/08/14/40152.html"
        }
      ],
      "manual": {
        "level": "medium",
        "reason": "台地の縁",
        "date": "2026/09/23"
      }
    },
    "千葉県市川市原木２": {
      "level": "extreme",
      "source": "manual",
      "history": [
        {
          "level": "high",
          "date": "2026/08",
          "text": "2026年8月千葉豪雨で二俣川が原木IC付近で溢水し、周辺の低い土地で床上浸水・地下駐車場が水没",
          "url": "https://note.com/kawasemi_jii/n/na569e6fbd258"
        }
      ],
      "manual": {
        "level": "extreme",
        "reason": "東京湾沿いの低地（洪水・高潮・中小河川）",
        "date": "2026/09/23"
      }
    },
    "千葉県市川市鬼高２": {
      "level": "high",
      "source": "manual",
      "history": [
        {
          "level": "medium",
          "date": "2026/08/13",
          "text": "2026年8月13日、短時間の激しい雨による浸水の危険で鬼高を含む地区に避難指示（警戒レベル4）",
          "url": "https://x.com/ichikawa_shi/status/2087818201824632892"
        }
      ],
      "manual": {
        "level": "high",
        "reason": "真間川流域の低地",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市上本郷": {
      "level": "unknown",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "unknown",
        "reason": "台地の下の低地か台地の上かで評価が変わる。番地で要確認",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市中和倉": {
      "level": "unknown",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "unknown",
        "reason": "常磐線の東西どちら側か、台地からの距離で評価が変わる。番地で要確認",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市仲井町３": {
      "level": "unknown",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "unknown",
        "reason": "台地のふもと。坂川流域の内水に注意。番地で要確認",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市大金平１": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "坂川沿いの田畑を区画整理した住宅地（常磐線の西の低地）",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市小山": {
      "level": "unknown",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "unknown",
        "reason": "台地（戸定が丘側）と低地が混在。番地で要確認",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市松戸新田": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "常磐線の東の下総台地。台地の谷底でなければ低リスク",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市栄町５": {
      "level": "extreme",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2026/08",
          "text": "2026年8月千葉豪雨で坂川の下流に被害、松戸市内で内水氾濫が広範囲（3時間150〜170mm）",
          "url": "https://note.com/kawasemi_jii/n/na569e6fbd258"
        }
      ],
      "manual": {
        "level": "extreme",
        "reason": "常磐線より西の低地。5m以上の浸水が広がり、栄町西などは7.5m以上の想定",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市樋野口": {
      "level": "extreme",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2026/08",
          "text": "2026年8月千葉豪雨で坂川の下流に被害、松戸市内で内水氾濫が広範囲（3時間150〜170mm）",
          "url": "https://note.com/kawasemi_jii/n/na569e6fbd258"
        }
      ],
      "manual": {
        "level": "extreme",
        "reason": "江戸川沿いの低地で5m以上。江戸川から約500mの家屋倒壊等氾濫想定区域にかかる可能性が高い",
        "date": "2026/09/23"
      }
    },
    "千葉県松戸市西馬橋相川町": {
      "level": "extreme",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2026/08",
          "text": "2026年8月千葉豪雨で坂川の下流に被害、松戸市内で内水氾濫が広範囲（3時間150〜170mm）",
          "url": "https://note.com/kawasemi_jii/n/na569e6fbd258"
        }
      ],
      "manual": {
        "level": "extreme",
        "reason": "常磐線より西、坂川沿いの低地。江戸川・坂川の氾濫で深く浸かる想定",
        "date": "2026/09/23"
      }
    },
    "千葉県流山市南流山６": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "江戸川・坂川沿いの低地（流山市の想定は最大10m）",
        "date": "2026/09/23"
      }
    },
    "千葉県船橋市前原西２": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "下総台地（津田沼駅の北側）",
        "date": "2026/09/23"
      }
    },
    "千葉県船橋市西習志野１": {
      "level": "low",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2026/09",
          "text": "台風25号で船橋市内陸部の高台のくぼ地に道路冠水の報告",
          "url": "https://weathernews.jp/news/202609/220091/"
        }
      ],
      "manual": {
        "level": "low",
        "reason": "下総台地。高台のくぼ地は冠水に注意",
        "date": "2026/09/23"
      }
    },
    "埼玉県さいたま市大宮区浅間町２": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "大宮台地",
        "date": "2026/09/23"
      }
    },
    "埼玉県さいたま市浦和区針ヶ谷２": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "大宮台地",
        "date": "2026/09/23"
      }
    },
    "埼玉県川口市元郷１": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "荒川氾濫で3〜5m、約1週間水が引かない",
        "date": "2026/09/23"
      }
    },
    "埼玉県川口市大字里": {
      "level": "unknown",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "unknown",
        "reason": "大字里は台地の縁から芝川沿いの低地まで含む。番地で要確認",
        "date": "2026/09/23"
      }
    },
    "埼玉県川口市鳩ヶ谷本町４": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "鳩ヶ谷台地の上（旧宿場町）",
        "date": "2026/09/23"
      }
    },
    "埼玉県戸田市本町５": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "荒川決壊で市の大部分が2階床上、深い所は3階床上まで。水が引くまで最大7日",
        "date": "2026/09/23"
      }
    },
    "埼玉県朝霞市仲町２": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "武蔵野台地（朝霞台）",
        "date": "2026/09/23"
      }
    },
    "埼玉県草加市吉町５": {
      "level": "high",
      "source": "manual",
      "history": [
        {
          "level": null,
          "date": "2023/06",
          "text": "2023年6月の大雨（台風2号）で草加市に災害救助法が適用",
          "url": "https://www.saitama-np.co.jp/articles/30980/postDetail"
        }
      ],
      "manual": {
        "level": "high",
        "reason": "水のたまりやすい低地。荒川・利根川・綾瀬川など11河川の浸水想定が重なる",
        "date": "2026/09/23"
      }
    },
    "埼玉県蕨市中央２": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "市域の100%が荒川の浸水想定区域（最大5m）",
        "date": "2026/09/23"
      }
    },
    "埼玉県越谷市登戸町": {
      "level": "high",
      "source": "manual",
      "history": [
        {
          "level": "medium",
          "date": "2023/06",
          "text": "2023年6月の大雨（台風2号）で越谷市域の約1/4が浸水（床上約500件・床下約2,400件）",
          "url": "https://www.saitama-np.co.jp/articles/30980/postDetail"
        }
      ],
      "manual": {
        "level": "high",
        "reason": "中川流域の低地。利根川などの氾濫で広く浸かる想定",
        "date": "2026/09/23"
      }
    },
    "埼玉県越谷市赤山町４": {
      "level": "high",
      "source": "manual",
      "history": [
        {
          "level": "medium",
          "date": "2023/06",
          "text": "2023年6月の大雨（台風2号）で越谷市域の約1/4が浸水（床上約500件・床下約2,400件）",
          "url": "https://www.saitama-np.co.jp/articles/30980/postDetail"
        }
      ],
      "manual": {
        "level": "high",
        "reason": "中川流域の低地。利根川などの氾濫で広く浸かる想定",
        "date": "2026/09/23"
      }
    },
    "東京都江戸川区北小岩５": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "荒川・江戸川・高潮が重なる低地。区の想定で最大10m以上・2週間以上浸水の地域あり。江東5区の広域避難の対象",
        "date": "2026/09/23"
      }
    },
    "東京都葛飾区柴又１": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "江戸川右岸の低地で堤防に近い。江東5区の広域避難の対象",
        "date": "2026/09/23"
      }
    },
    "東京都西東京市富士町４": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "武蔵野台地。石神井川の谷底でなければ低リスク",
        "date": "2026/09/23"
      }
    },
    "神奈川県川崎市多摩区登戸": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "多摩川の低地。登戸駅周辺は0.5〜3m、川岸〜駅は家屋倒壊等氾濫想定区域",
        "date": "2026/09/23"
      }
    },
    "神奈川県川崎市麻生区千代ケ丘１": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "多摩丘陵の上で浸水は低い。麻生区は土砂災害警戒区域が多く斜面の確認が必要",
        "date": "2026/09/23"
      }
    },
    "神奈川県横浜市神奈川区松見町４": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "丘の住宅地で浸水は受けにくいが、土砂災害警戒区域の確認が必要",
        "date": "2026/09/23"
      }
    }
  },
  "stations": {
    "さいたま新都心": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "大宮台地",
        "date": "2026/09/23"
      }
    },
    "上本郷": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "台地のふもと",
        "date": "2026/09/23"
      }
    },
    "下総中山": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "真間川流域の低地",
        "date": "2026/09/23"
      }
    },
    "与野": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "大宮台地",
        "date": "2026/09/23"
      }
    },
    "京成小岩": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "荒川・江戸川・高潮が重なる低地",
        "date": "2026/09/23"
      }
    },
    "北小金": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "台地の縁（西側は坂川の低地）",
        "date": "2026/09/23"
      }
    },
    "北松戸": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "常磐線の西側は5m以上の低地",
        "date": "2026/09/23"
      }
    },
    "南流山": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "江戸川・坂川沿いの低地",
        "date": "2026/09/23"
      }
    },
    "南越谷": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "中川流域の低地",
        "date": "2026/09/23"
      }
    },
    "原木中山": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "東京湾沿いの低地（2026年8月に近くの二俣川が溢水）",
        "date": "2026/09/23"
      }
    },
    "川口元郷": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "荒川の低地（3〜5m・約1週間）",
        "date": "2026/09/23"
      }
    },
    "戸田公園": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "荒川の低地（2階床上の想定）",
        "date": "2026/09/23"
      }
    },
    "新検見川": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "台地の縁",
        "date": "2026/09/23"
      }
    },
    "新百合ヶ丘": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "多摩丘陵（斜面は土砂災害に注意）",
        "date": "2026/09/23"
      }
    },
    "新越谷": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "中川流域の低地",
        "date": "2026/09/23"
      }
    },
    "朝霞": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "武蔵野台地",
        "date": "2026/09/23"
      }
    },
    "東伏見": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "武蔵野台地",
        "date": "2026/09/23"
      }
    },
    "松戸": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "駅の西側は江戸川沿いの低地",
        "date": "2026/09/23"
      }
    },
    "松戸新田": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "下総台地",
        "date": "2026/09/23"
      }
    },
    "柴又": {
      "level": "extreme",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "extreme",
        "reason": "江戸川右岸の低地",
        "date": "2026/09/23"
      }
    },
    "津田沼": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "下総台地（南側は低地）",
        "date": "2026/09/23"
      }
    },
    "登戸": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "多摩川の低地（駅〜川岸は家屋倒壊等氾濫想定区域）",
        "date": "2026/09/23"
      }
    },
    "稲毛": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "台地の縁",
        "date": "2026/09/23"
      }
    },
    "菊名": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "鶴見川流域の低地",
        "date": "2026/09/23"
      }
    },
    "蕨": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "荒川の浸水想定区域（市域100%）",
        "date": "2026/09/23"
      }
    },
    "谷塚": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "中川・綾瀬川流域の低地",
        "date": "2026/09/23"
      }
    },
    "馬橋": {
      "level": "high",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "high",
        "reason": "坂川沿いの低地",
        "date": "2026/09/23"
      }
    },
    "高根木戸": {
      "level": "low",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "low",
        "reason": "下総台地",
        "date": "2026/09/23"
      }
    },
    "鳩ヶ谷": {
      "level": "medium",
      "source": "manual",
      "history": [],
      "manual": {
        "level": "medium",
        "reason": "鳩ヶ谷台地の縁",
        "date": "2026/09/23"
      }
    }
  }
};
