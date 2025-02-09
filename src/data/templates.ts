export interface BlocoTemplate {
    name: string;
    duration: number;
}

export interface ReunioesPredefinidas {
    [key: string]: BlocoTemplate[];
}

export const reunioesPredefinidas: ReunioesPredefinidas = {
    daily: [
        { name: 'Daily - Time 1', duration: 3 },
        { name: 'Daily - Time 2', duration: 3 },
        { name: 'Daily - Time 3', duration: 3 },
        { name: 'Daily - Time 4', duration: 3 },
        { name: 'Daily - Time 5', duration: 3 },
        { name: 'Daily - Time 6', duration: 3 },
        { name: 'Daily - Time 7', duration: 3 }
    ],
    weekly: [
        { name: 'Reunião Escrita', duration: 8 },
        { name: 'Leitura Reunião Escrita', duration: 8 },
        { name: 'Revisão dos KPIs', duration: 10 },
        { name: 'Revisão das Metas de Setor e Individuais', duration: 25 },
        { name: 'Revisão de Combinados', duration: 5 }
    ],
    reuniao: [
        { name: 'Abertura de Pauta', duration: 5 },
        { name: 'Discussão', duration: 45 },
        { name: 'Definição Plano de Ação', duration: 10 }
    ],
    pomodoro: [
        { name: 'Foco', duration: 25 },
        { name: 'Break Time', duration: 5 },
        { name: 'Foco', duration: 25 },
        { name: 'Break Time', duration: 5 },
        { name: 'Foco', duration: 25 },
        { name: 'Break Time', duration: 5 }
    ],
    planning: [
        { name: 'Review Sprint Anterior', duration: 15 },
        { name: 'Apresentação Backlog', duration: 15 },
        { name: 'Estimativas', duration: 45 },
        { name: 'Definição Sprint Goal', duration: 15 }
    ],
    review: [
        { name: 'Apresentação do Sprint Goal', duration: 5 },
        { name: 'Demo das Features', duration: 40 },
        { name: 'Feedback do PO', duration: 15 }
    ],
    retro: [
        { name: 'Abertura', duration: 5 },
        { name: 'O que foi bom?', duration: 15 },
        { name: 'O que pode melhorar?', duration: 15 },
        { name: 'Ações para próximo Sprint', duration: 15 },
        { name: 'Fechamento', duration: 10 }
    ]
}; 