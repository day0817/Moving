// 自動生成ファイル（scripts/check_flood_risk.py）。直接編集しないこと。
// 手動評価・被害実績は data/flood_risk_notes.json を編集して再生成する。
const floodRiskUpdatedAt = "2026/10/02";
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
      "level": "low",
      "source": "auto",
      "history": [
        {
          "level": null,
          "date": "2026/08〜09",
          "text": "千葉市は2026年8月千葉豪雨（1時間115mm・12時間348mm）と台風25号の被害の中心。道路冠水・床上浸水が多数",
          "url": "https://tenki.jp/forecaster/s_ono/2026/08/14/40152.html"
        }
      ],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "medium",
        "reason": "台地から京成稲毛方面へ下る斜面側",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.636269,
        "lng": 140.091034,
        "title": "千葉県千葉市稲毛区稲毛東三丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.636269,140.091034&z=16&base=pale"
      }
    },
    "千葉県市川市原木２": {
      "level": "extreme",
      "source": "auto",
      "history": [
        {
          "level": "high",
          "date": "2026/08",
          "text": "2026年8月千葉豪雨で二俣川が原木IC付近で溢水し、周辺の低い土地で床上浸水・地下駐車場が水没",
          "url": "https://note.com/kawasemi_jii/n/na569e6fbd258"
        }
      ],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 3〜5m（2階床上）",
          "津波: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "東京湾沿いの低地（洪水・高潮・中小河川）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.699074,
        "lng": 139.945099,
        "title": "千葉県市川市原木二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.699074,139.945099&z=16&base=pale"
      }
    },
    "千葉県市川市大野町３": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.754017,
        "lng": 139.95578,
        "title": "千葉県市川市大野町三丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.754017,139.955780&z=16&base=pale"
      }
    },
    "千葉県松戸市上本郷": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺300m以内に 高潮（想定最大規模） 3〜5m（2階床上） の区域",
          "周辺300m以内に家屋倒壊等氾濫想定区域（河岸侵食）",
          "周辺300m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "unknown",
        "reason": "台地の下の低地か台地の上かで評価が変わる。番地で要確認",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.797871,
        "lng": 139.909256,
        "title": "千葉県松戸市上本郷",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.797871,139.909256&z=16&base=pale"
      }
    },
    "千葉県松戸市中和倉": {
      "level": "medium",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "medium",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺300m以内に 洪水（想定最大規模） 0.5〜3m（1階床上） の区域",
          "周辺300m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "unknown",
        "reason": "常磐線の東西どちら側か、台地からの距離で評価が変わる。番地で要確認",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.803913,
        "lng": 139.925171,
        "title": "千葉県松戸市中和倉",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.803913,139.925171&z=16&base=pale"
      }
    },
    "千葉県松戸市仲井町３": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "unknown",
        "reason": "台地のふもと。坂川流域の内水に注意。番地で要確認",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.787903,
        "lng": 139.91748,
        "title": "千葉県松戸市仲井町三丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.787903,139.917480&z=16&base=pale"
      }
    },
    "千葉県松戸市大金平１": {
      "level": "medium",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "medium",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5〜3m（1階床上） の区域",
          "周辺150m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "坂川沿いの田畑を区画整理した住宅地（常磐線の西の低地）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.834362,
        "lng": 139.926605,
        "title": "千葉県松戸市大金平一丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.834362,139.926605&z=16&base=pale"
      }
    },
    "千葉県松戸市小山": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 5〜10m（2階軒下以上）",
          "高潮（想定最大規模）: 3〜5m（2階床上）",
          "周辺300m以内に家屋倒壊等氾濫想定区域（氾濫流）",
          "周辺300m以内に家屋倒壊等氾濫想定区域（河岸侵食）",
          "周辺300m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 4,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "unknown",
        "reason": "台地（戸定が丘側）と低地が混在。番地で要確認",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.77317,
        "lng": 139.894501,
        "title": "千葉県松戸市小山",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.773170,139.894501&z=16&base=pale"
      }
    },
    "千葉県松戸市松戸新田": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "常磐線の東の下総台地。台地の谷底でなければ低リスク",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.785995,
        "lng": 139.917679,
        "title": "千葉県松戸市松戸新田",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.785995,139.917679&z=16&base=pale"
      }
    },
    "千葉県松戸市栄町５": {
      "level": "extreme",
      "source": "auto",
      "history": [
        {
          "level": null,
          "date": "2026/08",
          "text": "2026年8月千葉豪雨で坂川の下流に被害、松戸市内で内水氾濫が広範囲（3時間150〜170mm）",
          "url": "https://note.com/kawasemi_jii/n/na569e6fbd258"
        }
      ],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 5〜10m（2階軒下以上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺150m以内に家屋倒壊等氾濫想定区域（河岸侵食）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 4,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "常磐線より西の低地。5m以上の浸水が広がり、栄町西などは7.5m以上の想定",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.807484,
        "lng": 139.904053,
        "title": "千葉県松戸市栄町五丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.807484,139.904053&z=16&base=pale"
      }
    },
    "千葉県松戸市根本": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "高潮（想定最大規模）: 0.5m未満（床下程度）",
          "周辺300m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域",
          "周辺300m以内に家屋倒壊等氾濫想定区域（河岸侵食）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 1,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.789158,
        "lng": 139.901306,
        "title": "千葉県松戸市根本",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.789158,139.901306&z=16&base=pale"
      }
    },
    "千葉県松戸市胡録台": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.783924,
        "lng": 139.913177,
        "title": "千葉県松戸市胡録台",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.783924,139.913177&z=16&base=pale"
      }
    },
    "千葉県船橋市前原西２": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "下総台地（津田沼駅の北側）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.693729,
        "lng": 140.021027,
        "title": "千葉県船橋市前原西二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.693729,140.021027&z=16&base=pale"
      }
    },
    "千葉県船橋市東中山１": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/10/02",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5〜3m（1階床上） の区域",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺150m以内に 高潮（想定最大規模） 3〜5m（2階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.712799,
        "lng": 139.950241,
        "title": "千葉県船橋市東中山一丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.712799,139.950241&z=16&base=pale"
      }
    },
    "千葉県船橋市西習志野１": {
      "level": "low",
      "source": "auto",
      "history": [
        {
          "level": null,
          "date": "2026/09",
          "text": "台風25号で船橋市内陸部の高台のくぼ地に道路冠水の報告",
          "url": "https://weathernews.jp/news/202609/220091/"
        }
      ],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5m未満（床下程度） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "下総台地。高台のくぼ地は冠水に注意",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.72382,
        "lng": 140.03299,
        "title": "千葉県船橋市西習志野一丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.723820,140.032990&z=16&base=pale"
      }
    },
    "千葉県船橋市西船２": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.712875,
        "lng": 139.967712,
        "title": "千葉県船橋市西船二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.712875,139.967712&z=16&base=pale"
      }
    },
    "埼玉県さいたま市浦和区針ヶ谷２": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "大宮台地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.881683,
        "lng": 139.643707,
        "title": "埼玉県さいたま市浦和区針ヶ谷二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.881683,139.643707&z=16&base=pale"
      }
    },
    "埼玉県川口市元郷１": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "荒川氾濫で3〜5m、約1週間水が引かない",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.799217,
        "lng": 139.732452,
        "title": "埼玉県川口市元郷一丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.799217,139.732452&z=16&base=pale"
      }
    },
    "埼玉県川口市大字里": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "unknown",
        "reason": "大字里は台地の縁から芝川沿いの低地まで含む。番地で要確認",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.834454,
        "lng": 139.729843,
        "title": "埼玉県川口市里",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.834454,139.729843&z=16&base=pale"
      }
    },
    "埼玉県川口市鳩ヶ谷本町４": {
      "level": "medium",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "medium",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5〜3m（1階床上） の区域",
          "周辺150m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "鳩ヶ谷台地の上（旧宿場町）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.832142,
        "lng": 139.745834,
        "title": "埼玉県川口市鳩ヶ谷本町四丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.832142,139.745834&z=16&base=pale"
      }
    },
    "埼玉県戸田市本町５": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 5〜10m（2階軒下以上）",
          "周辺150m以内に家屋倒壊等氾濫想定区域（氾濫流）",
          "周辺150m以内に家屋倒壊等氾濫想定区域（河岸侵食）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 4,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "荒川決壊で市の大部分が2階床上、深い所は3階床上まで。水が引くまで最大7日",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.805103,
        "lng": 139.678375,
        "title": "埼玉県戸田市本町五丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.805103,139.678375&z=16&base=pale"
      }
    },
    "埼玉県朝霞市仲町２": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "武蔵野台地（朝霞台）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.795135,
        "lng": 139.602097,
        "title": "埼玉県朝霞市仲町二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.795135,139.602097&z=16&base=pale"
      }
    },
    "埼玉県草加市吉町５": {
      "level": "high",
      "source": "auto",
      "history": [
        {
          "level": null,
          "date": "2023/06",
          "text": "2023年6月の大雨（台風2号）で草加市に災害救助法が適用",
          "url": "https://www.saitama-np.co.jp/articles/30980/postDetail"
        }
      ],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "水のたまりやすい低地。荒川・利根川・綾瀬川など11河川の浸水想定が重なる",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.820438,
        "lng": 139.804062,
        "title": "埼玉県草加市吉町五丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.820438,139.804062&z=16&base=pale"
      }
    },
    "埼玉県蕨市中央２": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺150m以内に 洪水（想定最大規模） 3〜5m（2階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "市域の100%が荒川の浸水想定区域（最大5m）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.821808,
        "lng": 139.689041,
        "title": "埼玉県蕨市中央二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.821808,139.689041&z=16&base=pale"
      }
    },
    "埼玉県越谷市新越谷１": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/10/02",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.874283,
        "lng": 139.782471,
        "title": "埼玉県越谷市新越谷一丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.874283,139.782471&z=16&base=pale"
      }
    },
    "東京都江戸川区北小岩５": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "荒川・江戸川・高潮が重なる低地。区の想定で最大10m以上・2週間以上浸水の地域あり。江東5区の広域避難の対象",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.740654,
        "lng": 139.889084,
        "title": "東京都江戸川区北小岩五丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.740654,139.889084&z=16&base=pale"
      }
    },
    "東京都練馬区高野台５": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5m未満（床下程度） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.748005,
        "lng": 139.611603,
        "title": "東京都練馬区高野台五丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.748005,139.611603&z=16&base=pale"
      }
    },
    "東京都葛飾区金町２": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/10/02",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺150m以内に 洪水（想定最大規模） 3〜5m（2階床上） の区域",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.764145,
        "lng": 139.870316,
        "title": "東京都葛飾区金町二丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.764145,139.870316&z=16&base=pale"
      }
    },
    "東京都葛飾区高砂６": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/10/02",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.753571,
        "lng": 139.860794,
        "title": "東京都葛飾区高砂六丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.753571,139.860794&z=16&base=pale"
      }
    },
    "東京都西東京市富士町４": {
      "level": "medium",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "medium",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5m未満（床下程度）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 1,
            "nearby": 1
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "武蔵野台地。石神井川の谷底でなければ低リスク",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.73024,
        "lng": 139.56485,
        "title": "東京都西東京市富士町四丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.730240,139.564850&z=16&base=pale"
      }
    },
    "神奈川県川崎市多摩区登戸": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "周辺300m以内に家屋倒壊等氾濫想定区域（氾濫流）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "多摩川の低地。登戸駅周辺は0.5〜3m、川岸〜駅は家屋倒壊等氾濫想定区域",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.620766,
        "lng": 139.563782,
        "title": "神奈川県川崎市多摩区登戸",
        "source": "gsi",
        "precision": "town",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.620766,139.563782&z=16&base=pale"
      }
    },
    "神奈川県横浜市神奈川区松見町４": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "medium",
        "reason": "丘の住宅地で浸水は受けにくいが、土砂災害警戒区域の確認が必要",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.50375,
        "lng": 139.639984,
        "title": "神奈川県横浜市神奈川区松見町四丁目",
        "source": "gsi",
        "precision": "chome",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.503750,139.639984&z=16&base=pale"
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
    "みのり台": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7892922,
        "lng": 139.9292041,
        "title": "みのり台駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.789292,139.929204&z=16&base=pale"
      }
    },
    "上本郷": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "medium",
        "reason": "台地のふもと",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7896751,
        "lng": 139.9162363,
        "title": "上本郷駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.789675,139.916236&z=16&base=pale"
      }
    },
    "下総中山": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 3〜5m（2階床上）",
          "周辺150m以内に 津波 0.5m未満（床下程度） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "真間川流域の低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7143952,
        "lng": 139.9428623,
        "title": "下総中山駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.714395,139.942862&z=16&base=pale"
      }
    },
    "与野": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "大宮台地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8834881,
        "lng": 139.6374207,
        "title": "与野駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.883488,139.637421&z=16&base=pale"
      }
    },
    "京成中山": {
      "level": "medium",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "medium",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7168708,
        "lng": 139.9447308,
        "title": "京成中山駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.716871,139.944731&z=16&base=pale"
      }
    },
    "京成小岩": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "荒川・江戸川・高潮が重なる低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7423294,
        "lng": 139.8834675,
        "title": "京成小岩駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.742329,139.883467&z=16&base=pale"
      }
    },
    "京成稲毛": {
      "level": "medium",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "medium",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.6377954,
        "lng": 140.0855037,
        "title": "京成稲毛駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.637795,140.085504&z=16&base=pale"
      }
    },
    "京成金町": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/10/02",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7686276,
        "lng": 139.8704721,
        "title": "京成金町駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.768628,139.870472&z=16&base=pale"
      }
    },
    "京成高砂": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/10/02",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.750941,
        "lng": 139.8674406,
        "title": "京成高砂駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.750941,139.867441&z=16&base=pale"
      }
    },
    "八柱": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7915908,
        "lng": 139.937639,
        "title": "八柱駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.791591,139.937639&z=16&base=pale"
      }
    },
    "前原": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7009518,
        "lng": 140.027839,
        "title": "前原駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.700952,140.027839&z=16&base=pale"
      }
    },
    "北小金": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "medium",
        "reason": "台地の縁（西側は坂川の低地）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8330516,
        "lng": 139.9315725,
        "title": "北小金駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.833052,139.931572&z=16&base=pale"
      }
    },
    "北松戸": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺150m以内に 洪水（想定最大規模） 5〜10m（2階軒下以上） の区域",
          "周辺150m以内に 高潮（想定最大規模） 3〜5m（2階床上） の区域",
          "周辺150m以内に家屋倒壊等氾濫想定区域（河岸侵食）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "常磐線の西側は5m以上の低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8006148,
        "lng": 139.9122142,
        "title": "北松戸駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.800615,139.912214&z=16&base=pale"
      }
    },
    "北習志野": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7216072,
        "lng": 140.0421662,
        "title": "北習志野駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.721607,140.042166&z=16&base=pale"
      }
    },
    "南流山": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 5〜10m（2階軒下以上）",
          "高潮（想定最大規模）: 0.5m未満（床下程度）",
          "周辺150m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域",
          "家屋倒壊等氾濫想定区域（氾濫流）の区域内（家屋が流失・倒壊するおそれ）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 4,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 1,
            "nearby": 1
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 1,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "江戸川・坂川沿いの低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8389226,
        "lng": 139.904336,
        "title": "南流山駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.838923,139.904336&z=16&base=pale"
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
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 3〜5m（2階床上）",
          "津波: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "東京湾沿いの低地（2026年8月に近くの二俣川が溢水）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7031484,
        "lng": 139.9416595,
        "title": "原木中山駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.703148,139.941659&z=16&base=pale"
      }
    },
    "向ヶ丘遊園": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.617508,
        "lng": 139.5647899,
        "title": "向ヶ丘遊園駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.617508,139.564790&z=16&base=pale"
      }
    },
    "和光市": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7884097,
        "lng": 139.6126725,
        "title": "和光市駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.788410,139.612673&z=16&base=pale"
      }
    },
    "妙蓮寺": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.4985364,
        "lng": 139.6332256,
        "title": "妙蓮寺駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.498536,139.633226&z=16&base=pale"
      }
    },
    "川口": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.8019257,
        "lng": 139.7175116,
        "title": "川口駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.801926,139.717512&z=16&base=pale"
      }
    },
    "川口元郷": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "荒川の低地（3〜5m・約1週間）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8006371,
        "lng": 139.7305528,
        "title": "川口元郷駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.800637,139.730553&z=16&base=pale"
      }
    },
    "市川大野": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "周辺150m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7540337,
        "lng": 139.9513655,
        "title": "市川大野駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.754034,139.951366&z=16&base=pale"
      }
    },
    "戸田": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.8177759,
        "lng": 139.6690954,
        "title": "戸田駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.817776,139.669095&z=16&base=pale"
      }
    },
    "戸田公園": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "荒川の低地（2階床上の想定）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8087691,
        "lng": 139.6789164,
        "title": "戸田公園駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.808769,139.678916&z=16&base=pale"
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
    "新津田沼": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.6897463,
        "lng": 140.0232213,
        "title": "新津田沼駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.689746,140.023221&z=16&base=pale"
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
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "中川流域の低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8753,
        "lng": 139.7909,
        "title": "新越谷駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.875300,139.790900&z=16&base=pale"
      }
    },
    "朝霞": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "武蔵野台地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.79703,
        "lng": 139.6002238,
        "title": "朝霞駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.797030,139.600224&z=16&base=pale"
      }
    },
    "東中山": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7143733,
        "lng": 139.952865,
        "title": "東中山駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.714373,139.952865&z=16&base=pale"
      }
    },
    "東伏見": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "武蔵野台地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7287024,
        "lng": 139.5642364,
        "title": "東伏見駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.728702,139.564236&z=16&base=pale"
      }
    },
    "松戸": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "高潮（想定最大規模）: 0.5m未満（床下程度）",
          "周辺150m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 1,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "駅の西側は江戸川沿いの低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7845,
        "lng": 139.9007,
        "title": "松戸駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.784500,139.900700&z=16&base=pale"
      }
    },
    "松戸新田": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "下総台地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7906265,
        "lng": 139.9226166,
        "title": "松戸新田駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.790627,139.922617&z=16&base=pale"
      }
    },
    "柴又": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "高潮（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "extreme",
        "reason": "江戸川右岸の低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7563461,
        "lng": 139.8752164,
        "title": "柴又駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.756346,139.875216&z=16&base=pale"
      }
    },
    "武蔵関": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5〜3m（1階床上） の区域",
          "周辺150m以内に家屋倒壊等氾濫想定区域（氾濫流）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7272781,
        "lng": 139.5770122,
        "title": "武蔵関駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.727278,139.577012&z=16&base=pale"
      }
    },
    "津田沼": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "下総台地（南側は低地）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.6917,
        "lng": 140.0204,
        "title": "津田沼駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.691700,140.020400&z=16&base=pale"
      }
    },
    "登戸": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "周辺150m以内に家屋倒壊等氾濫想定区域（氾濫流）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "多摩川の低地（駅〜川岸は家屋倒壊等氾濫想定区域）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.6211127,
        "lng": 139.5695457,
        "title": "登戸駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.621113,139.569546&z=16&base=pale"
      }
    },
    "石神井公園": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/10/02",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7434548,
        "lng": 139.6069909,
        "title": "石神井公園駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.743455,139.606991&z=16&base=pale"
      }
    },
    "稲毛": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "medium",
        "reason": "台地の縁",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.6369851,
        "lng": 140.092676,
        "title": "稲毛駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.636985,140.092676&z=16&base=pale"
      }
    },
    "草加": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.8285132,
        "lng": 139.8013292,
        "title": "草加駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.828513,139.801329&z=16&base=pale"
      }
    },
    "菊名": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "周辺150m以内に 洪水（想定最大規模） 0.5m未満（床下程度） の区域",
          "周辺150m以内に土砂災害警戒区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "鶴見川流域の低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.5096856,
        "lng": 139.6302732,
        "title": "菊名駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.509686,139.630273&z=16&base=pale"
      }
    },
    "蕨": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "荒川の浸水想定区域（市域100%）",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8281232,
        "lng": 139.6903799,
        "title": "蕨駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.828123,139.690380&z=16&base=pale"
      }
    },
    "西船橋": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/10/02",
        "reasons": [
          "洪水（想定最大規模）: 0.5m未満（床下程度）",
          "周辺150m以内に 洪水（想定最大規模） 0.5〜3m（1階床上） の区域",
          "高潮（想定最大規模）: 3〜5m（2階床上）",
          "周辺150m以内に 津波 0.5〜3m（1階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 1,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 3,
            "nearby": 3
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7075,
        "lng": 139.9592,
        "title": "西船橋駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.707500,139.959200&z=16&base=pale"
      }
    },
    "谷塚": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "中川・綾瀬川流域の低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.813959,
        "lng": 139.8013312,
        "title": "谷塚駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.813959,139.801331&z=16&base=pale"
      }
    },
    "金町": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）",
          "周辺150m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7695843,
        "lng": 139.8706926,
        "title": "金町駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.769584,139.870693&z=16&base=pale"
      }
    },
    "馬橋": {
      "level": "extreme",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "extreme",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 3〜5m（2階床上）",
          "高潮（想定最大規模）: 0.5m未満（床下程度）",
          "周辺150m以内に 高潮（想定最大規模） 0.5〜3m（1階床上） の区域",
          "周辺150m以内に家屋倒壊等氾濫想定区域（河岸侵食）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 3,
            "nearby": 4
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 1
          },
          "hightide": {
            "status": "ok",
            "center": 1,
            "nearby": 2
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "high",
        "reason": "坂川沿いの低地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8115469,
        "lng": 139.9173541,
        "title": "馬橋駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.811547,139.917354&z=16&base=pale"
      }
    },
    "高根公団": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "point": {
        "lat": 35.7308125,
        "lng": 140.0302561,
        "title": "高根公団駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.730812,140.030256&z=16&base=pale"
      }
    },
    "高根木戸": {
      "level": "low",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "low",
        "checked_at": "2026/09/26",
        "reasons": [
          "調べた範囲に浸水・土砂災害の想定区域はありません"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "low",
        "reason": "下総台地",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.7275099,
        "lng": 140.0342835,
        "title": "高根木戸駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.727510,140.034283&z=16&base=pale"
      }
    },
    "鳩ヶ谷": {
      "level": "high",
      "source": "auto",
      "history": [],
      "auto": {
        "status": "ok",
        "level": "high",
        "checked_at": "2026/09/26",
        "reasons": [
          "洪水（想定最大規模）: 0.5〜3m（1階床上）"
        ],
        "layers": {
          "flood": {
            "status": "ok",
            "center": 2,
            "nearby": 2
          },
          "hanran": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "kagan": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "hightide": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "tsunami": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          },
          "naisui": {
            "status": "unavailable"
          },
          "dosya": {
            "status": "ok",
            "center": 0,
            "nearby": 0
          }
        },
        "unknown_colors": []
      },
      "manual": {
        "level": "medium",
        "reason": "鳩ヶ谷台地の縁",
        "date": "2026/09/23"
      },
      "point": {
        "lat": 35.8314948,
        "lng": 139.7366118,
        "title": "鳩ヶ谷駅",
        "source": "station",
        "precision": "station",
        "map_url": "https://disaportal.gsi.go.jp/maps/?ll=35.831495,139.736612&z=16&base=pale"
      }
    }
  }
};
