import os

paper_dir = "/Users/minhngoc/Downloads/RAPT-CLIP-RAER 2/paper"
files = os.listdir(paper_dir)
files_lower = [f.lower() for f in files]
files_str = "\n".join(files)

# Reference list from KLTN with key identifiers
refs = {
    1: {"authors": "Gan, Qi, Wu, Lin", "title": "Large Language Models in Education", "arxiv": "2311.13160", "key": "2311.13160"},
    2: {"authors": "Saini, Sharma, Tripathi", "title": "AI in Education: Using AI Tools", "key": "Artificial Intelligence (AI) In Education"},
    3: {"authors": "Xie, Li, Lu, Pang, Song, Lu", "title": "MSC-Trans Multi-Feature-Fusion", "key": "MSC-Trans"},
    4: {"authors": "Dewan, Murshed, Lin", "title": "Engagement detection in online learning", "key": "Engagement_detection_in_online_learning"},
    5: {"authors": "Wu et al.", "title": "CMOSE Comprehensive Multi-Modality", "key": "CMOSE"},
    6: {"authors": "Yulius, Nasrullah, Haris", "title": "Facial Expression Classification KAN MLP", "key": "Facial Expression Classification"},
    7: {"authors": "Xenos, Foteinopoulou, Ntinou, Patras", "title": "VLLMs Emotion Understanding", "arxiv": "2404.07078", "key": "2404.07078"},
    8: {"authors": "Hoang, Kim, Yang, Lee", "title": "Context-Aware Emotion Recognition Visual Relationship", "key": "Context_Aware_Emotion_VRD"},
    9: {"authors": "Liu, Mao, Zhao, Li, Xu, Chen", "title": "MER-CLIP AU-Guided", "arxiv": "2505.05937", "key": "2505.05937"},
    10: {"authors": "Zheng, Yang, He, Yang, Huang", "title": "Hierarchical Cross-modal Prompt Learning", "key": "Hierarchical_Cross-modal_Prompt"},
    11: {"authors": "Nezami, Dras, Hamey, Richards", "title": "Automatic Recognition Student Engagement Deep Learning", "arxiv": "1808.02324", "key": "1808.02324"},
    12: {"authors": "Bosch, D'Mello", "title": "Affective Experience Novice Computer Programmers", "key": "s40593-015-0069-5"},
    13: {"authors": "Reisenzein, Junge, Studtmann, Huber", "title": "Observational Measurement Emotions", "key": "Reisenzein"},
    14: {"authors": "Pekrun, Goetz, Titz, Perry", "title": "Academic Emotions Students Self-Regulated", "key": "Pekrun"},
    15: {"authors": "Lu, Yang, Song, Chen, Wang, Bian", "title": "Video Dataset Classroom Group Engagement", "key": "Video_Dataset_for_Classroom"},
    16: {"authors": "Subramainan", "title": "Systematic Review Students Engagement Classroom", "key": "IJACSA"},
    17: {"authors": "Gupta, D'Cunha, Awasthi, Balasubramanian", "title": "DAiSEE User Engagement", "arxiv": "1609.01885", "key": "1609.01885"},
    18: {"authors": "Qarbal, Sael, Ouahabi", "title": "Student Engagement Detection Computer Vision Literature Review", "key": "Students Engagement Detection Literature"},
    19: {"authors": "Alruwais, Zakariah", "title": "Student-Engagement Detection Machine Learning", "key": "electronics-12-00731"},
    20: {"authors": "Llurba, Fretes, Palau", "title": "Classroom Emotion Monitoring Image Processing", "key": "Classroom Emotion Monitoring"},
    21: {"authors": "Whitehill, Serpell, Lin, Foster, Movellan", "title": "Faces of Engagement", "key": "Whitehill"},
    22: {"authors": "Le, Nguyen, Tran, Tjiputra, Le, Nguyen", "title": "Uncertainty-aware Label Distribution Learning FER", "arxiv": "2209.10448", "key": "2209.10448"},
    23: {"authors": "Zhalehpour, Onder, Akhtar, Erdem", "title": "BAUM-1 Spontaneous Audio-Visual Face", "key": "IEEETAC-2017"},
    24: {"authors": "Zhu, Zhuang, Zhao, Xu, Meng", "title": "expression recognition MobileNetV2", "key": "s41598-024-58736-x"},
    25: {"authors": "Lucey, Cohn, Kanade, Saragih", "title": "Extended Cohn-Kanade CK+", "key": "CK+"},
    26: {"authors": "Zhao, Xuan, Lou, Yu, Yang", "title": "Context-Aware Academic Emotion Dataset RAER", "arxiv": "2507.00586", "key": "2507.00586"},
    27: {"authors": "Tang, Gong, Xiao, Xiong, Bao", "title": "Facial Expression Recognition Students Emotional Engagement Science", "key": "Tang2025"},
    28: {"authors": "Fredricks, Blumenfeld, Paris", "title": "School Engagement Potential Concept", "key": "Fredricks"},
    29: {"authors": "Pekrun", "title": "Control-Value Theory Achievement Emotions", "key": "Pekrun_Control"},
    30: {"authors": "Finn, Zimmer", "title": "Student Engagement What Is It Why", "key": "Finn"},
    31: {"authors": "Skinner, Pitzer", "title": "Developmental Dynamics Student Engagement Coping", "key": "Skinner"},
    32: {"authors": "Christenson, Reschly, Wylie", "title": "Handbook Research Student Engagement", "key": "Christenson"},
    33: {"authors": "Marquez-Carpintero", "title": "DIPSER Dataset In-Person Student Engagement", "arxiv": "2502.20209", "key": "2502 20209"},
    34: {"authors": "Khaireddin, Chen", "title": "Facial Emotion Recognition FER2013", "key": "FER2013"},
    35: {"authors": "Savchenko", "title": "Facial expression attributes recognition multi-task lightweight", "key": "Savchenko"},
    36: {"authors": "Dosovitskiy et al.", "title": "Image Worth 16x16 Words ViT", "arxiv": "2010.11929", "key": "2010.11929"},
    37: {"authors": "Wang et al.", "title": "Survey Facial Expression Recognition Static Dynamic", "key": "Survey FER Static Dynamic"},
    38: {"authors": "Kopalidis, Solachidis, Vretos, Daras", "title": "Advances Facial Expression Recognition Survey", "key": "Kopalidis"},
    39: {"authors": "Aviezer et al.", "title": "Angry Disgusted Afraid Malleability Emotion", "key": "Aviezer"},
    40: {"authors": "Kosti, Alvarez, Recasens, Lapedriza", "title": "Context Based Emotion Recognition EMOTIC", "key": "emotic"},
    41: {"authors": "Lee, Kim, Kim, Park, Sohn", "title": "Context-Aware Emotion Recognition Networks CAER", "key": "caer-net"},
    42: {"authors": "Radford et al.", "title": "Learning Transferable Visual Models Natural Language CLIP", "key": "clip_paper"},
    43: {"authors": "Zhou, Yang, Loy, Liu", "title": "Conditional Prompt Learning Vision-Language CoCoOp", "arxiv": "2203.05557", "key": "2203.05557"},
    44: {"authors": "Zhou, Yang, Loy, Liu", "title": "Learning to Prompt Vision-Language CoOp", "key": "Learning to Prompt"},
    45: {"authors": "Zhao, Patras", "title": "Prompting Visual-Language Dynamic FER DFER-CLIP", "key": "DFER-CLIP"},
    46: {"authors": "Li, Niu, Zhu, Zhao", "title": "CLIPER Unified Vision-Language FER", "key": "CLIPER"},
    47: {"authors": "Pianta, Hamre", "title": "Conceptualization Measurement Classroom Processes CLASS", "key": "Conceptualization Measurement"},
    48: {"authors": "Soloviev", "title": "Machine learning student engagement facial expressions", "key": "Soloviev"},
    49: {"authors": "Huan, Li, Zhou", "title": "Emotion-aware adaptation CLIP facial expression", "key": "s10462-025-11468-4"},
    50: {"authors": "2405.04251", "title": "arxiv paper", "key": "2405.04251"},
    51: {"authors": "He, Zhang, Ren, Sun", "title": "Deep Residual Learning ResNet", "arxiv": "1512.03385", "key": "1512.03385"},
    52: {"authors": "Vaswani et al.", "title": "Attention Is All You Need Transformer", "arxiv": "1706.03762", "key": "1706.03762"},
    53: {"authors": "Bahdanau, Cho, Bengio", "title": "Neural Machine Translation Attention", "arxiv": "1409.0473", "key": "1408.6027"},
    54: {"authors": "Ba, Kiros, Hinton", "title": "Layer Normalization", "arxiv": "1607.06450", "key": "1607.06450"},
    55: {"authors": "Devlin, Chang, Lee, Toutanova", "title": "BERT Pre-training Bidirectional Transformers", "key": "BERT"},
    56: {"authors": "Sun, Shrivastava, Singh, Gupta", "title": "Revisiting Unreasonable Effectiveness Data", "key": "Revisiting_Data"},
    57: {"authors": "Russakovsky et al.", "title": "ImageNet Large Scale Visual Recognition", "key": "ImageNet"},
    58: {"authors": "Zhang", "title": "Generalizable Prompt Tuning Vision-Language", "arxiv": "2410.03189", "key": "2410.03189"},
    59: {"authors": "Zang et al.", "title": "Attention-based Temporal Weighted CNN Action", "arxiv": "1803.07179", "key": "1803.07179"},
    60: {"authors": "He, Fan, Wu, Xie, Girshick", "title": "Momentum Contrast MoCo Unsupervised", "key": "MoCo"},
    61: {"authors": "Houlsby et al.", "title": "Parameter-Efficient Transfer Learning NLP Adapter", "arxiv": "1902.00751", "key": "1902.00751"},
    62: {"authors": "Cao, Wei, Gaidon, Arechiga, Ma", "title": "Learning Imbalanced Datasets LDAM Loss", "key": "LDAM"},
    63: {"authors": "Das, Dev", "title": "Optimizing student engagement detection facial behavioral", "key": "Optimizing Student Engagement"},
    64: {"authors": "Hara, Kataoka, Satoh", "title": "Spatiotemporal 3D CNNs 3DResNet", "arxiv": "1711.09577", "key": "1711.05101"},
    65: {"authors": "Carreira, Zisserman", "title": "Quo Vadis Action Recognition I3D Kinetics", "key": "I3D"},
    66: {"authors": "Wang et al.", "title": "Rethinking Learning Paradigm Dynamic FER M3DFEL", "key": "M3DFEL"},
    67: {"authors": "Zhao, Liu", "title": "Former-DFER Dynamic FER Transformer", "key": "Former-DFER"},
    68: {"authors": "van der Maaten", "title": "t-SNE", "key": "van_der_Maaten"},
    69: {"authors": "Qiao, Hu, Zhao", "title": "Multimodal Representation Learning Semantic Relations", "arxiv": "2508.17497", "key": "2508.17497"},
    70: {"authors": "Selvaraju, Cogswell, Das, Vedantam", "title": "Grad-CAM Visual Explanations", "key": "GradCAM"},
}

missing = []
found = []
for ref_num, info in refs.items():
    key = info["key"].lower()
    matched = False
    for f in files:
        fl = f.lower()
        if key.lower() in fl:
            matched = True
            found.append((ref_num, info["title"][:60], f))
            break
    if not matched:
        # Try arxiv id
        arxiv = info.get("arxiv", "").lower()
        if arxiv:
            for f in files:
                fl = f.lower()
                if arxiv in fl:
                    matched = True
                    found.append((ref_num, info["title"][:60], f))
                    break
    if not matched:
        # Try author name
        first_author = info["authors"].split(",")[0].strip().split()[-1].lower()
        for f in files:
            fl = f.lower()
            if first_author in fl and len(first_author) > 3:
                matched = True
                found.append((ref_num, info["title"][:60], f))
                break
    if not matched:
        missing.append((ref_num, info))

print(f"=== FOUND: {len(found)} / 70 ===")
print(f"=== MISSING: {len(missing)} / 70 ===\n")
for ref_num, info in missing:
    arxiv = info.get("arxiv", "N/A")
    print(f"[{ref_num}] {info['authors'][:40]} - \"{info['title'][:70]}\" | arxiv: {arxiv}")
