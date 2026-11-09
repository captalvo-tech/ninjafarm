/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 *
 * O ROADMAP É O REGISTRO OFICIAL DA EVOLUÇÃO DESTE PROJETO.
 *
 * Qualquer alteração funcional relevante neste módulo exige:
 *
 * 1. Atualizar o registro de funcionalidades do roadmap.
 * 2. Registrar a alteração no histórico permanente.
 * 3. Atualizar a documentação técnica relacionada.
 * 4. Registrar funcionalidades adicionadas, modificadas ou removidas.
 * 5. Relacionar a mudança ao commit e aos testes realizados.
 *
 * Funcionalidades removidas DEVEM permanecer no histórico com
 * status REMOVIDO. Nunca apagar seu registro histórico.
 *
 * Documentação:
 * - docs/02-ROADMAP.md
 * - docs/19-LOG-IMPLEMENTACAO.md
 * - Registro estruturado de funcionalidades do projeto
 *
 * IMPORTANTE: Código, roadmap e documentação devem permanecer
 * sincronizados durante todo o desenvolvimento.
 * ============================================================================
 */

import type { BuildingDefinition, BuildingType, ResourceInventory } from './types';

export const FARM_CONFIG = {
    // Dimensão lógica da fazenda: (16x9)*4 = 64x36 = 2.304 células
    GRID_WIDTH: 64,
    GRID_HEIGHT: 36,
    CELL_SIZE_METERS: 2.0, // cada célula tem 2m x 2m

    // Ciclo dia/noite (segundos reais para 1 dia completo no jogo)
    DAY_DURATION_SECONDS: 180, // 3 minutos por dia

    // Recursos iniciais generosos para o MVP
    INITIAL_RESOURCES: {
        wood: 150,
        metal: 100,
        parts: 40,
        food: 30,
        water: 120,
        energy: 80
    } as ResourceInventory,

    // Limites de armazenamento padrão
    DEFAULT_STORAGE_CAPACITY: {
        wood: 500,
        metal: 400,
        parts: 200,
        food: 300,
        water: 500,
        energy: 300
    } as ResourceInventory,

    // Parâmetros de offline catchup
    OFFLINE_CATCHUP_CAP_HOURS: 24,

    // Velocidade do ninja
    NINJA_WALK_SPEED: 4.5, // m/s
    NINJA_RUN_SPEED: 7.5 // m/s
};

export const BUILDING_CATALOG: Record<BuildingType, BuildingDefinition> = {
    hq: {
        id: 'hq',
        name: 'Sede da Fazenda',
        description: 'Centro de comando e refúgio ninja. Ponto de retorno e controle.',
        footprint: { width: 4, height: 4 },
        cost: { wood: 50, metal: 30, parts: 10 },
        maxHealth: 500,
        energyConsumption: 5,
        waterConsumption: 2,
        storageCapacity: { wood: 200, metal: 200, parts: 100, food: 150 }
    },
    shed: {
        id: 'shed',
        name: 'Galpão de Suprimentos',
        description: 'Armazena materiais brutos, colheitas e peças manufaturadas.',
        footprint: { width: 3, height: 3 },
        cost: { wood: 40, metal: 20 },
        maxHealth: 300,
        storageCapacity: { wood: 300, metal: 200, parts: 100, food: 200 }
    },
    crop_field: {
        id: 'crop_field',
        name: 'Canteiro Agrícola',
        description: 'Solo preparado e nivelado para cultivo de arroz e hortaliças.',
        footprint: { width: 2, height: 2 },
        cost: { wood: 10, water: 5 },
        maxHealth: 100,
        waterConsumption: 1.5 // consome água durante crescimento
    },
    solar_panel: {
        id: 'solar_panel',
        name: 'Painel Fotovoltaico',
        description: 'Capta irradiação solar e gera eletricidade limpa durante o dia.',
        footprint: { width: 2, height: 1 },
        cost: { metal: 25, parts: 15 },
        maxHealth: 150,
        energyProduction: 18 // W no pico (meio-dia solar)
    },
    battery: {
        id: 'battery',
        name: 'Banco de Baterias',
        description: 'Acumula excedente de energia para abastecer a base durante a noite.',
        footprint: { width: 1, height: 1 },
        cost: { metal: 20, parts: 20 },
        maxHealth: 150,
        storageCapacity: { energy: 150 }
    },
    water_tank: {
        id: 'water_tank',
        name: 'Cisterna / Tanque Hídrico',
        description: 'Armazena água para irrigação e manutenção animal.',
        footprint: { width: 2, height: 2 },
        cost: { wood: 20, metal: 15 },
        maxHealth: 200,
        storageCapacity: { water: 300 }
    },
    water_pump: {
        id: 'water_pump',
        name: 'Bomba Hídrica',
        description: 'Extrai e distribui água subterrânea continuamente usando energia.',
        footprint: { width: 1, height: 1 },
        cost: { metal: 25, parts: 15 },
        maxHealth: 150,
        energyConsumption: 6,
        waterProduction: 8
    },
    chicken_coop: {
        id: 'chicken_coop',
        name: 'Galinheiro Sustentável',
        description: 'Abrigo para galinhas poedeiras. Produz ovos e adubo natural.',
        footprint: { width: 3, height: 2 },
        cost: { wood: 35, metal: 10 },
        maxHealth: 180,
        waterConsumption: 1
    },
    fish_pond: {
        id: 'fish_pond',
        name: 'Tanque Aquícola',
        description: 'Criação de peixes com fluxo hídrico constante.',
        footprint: { width: 3, height: 3 },
        cost: { wood: 25, metal: 15, water: 50 },
        maxHealth: 250,
        waterConsumption: 2,
        energyConsumption: 2
    },
    lamp_post: {
        id: 'lamp_post',
        name: 'Poste de Luz (Tōrō)',
        description: 'Poste de iluminação tradicional com lanterna quente que se acende automaticamente à noite.',
        footprint: { width: 1, height: 1 },
        cost: { wood: 8, metal: 4 },
        maxHealth: 100,
        energyConsumption: 1
    },
    torii_gate: {
        id: 'torii_gate',
        name: 'Portal Torii Sagrado',
        description: 'Monumental portal xintoísta tradicional carmesim que purifica a fazenda e abençoa a colheita.',
        footprint: { width: 3, height: 1 },
        cost: { wood: 30, metal: 10 },
        maxHealth: 400
    },
    bonfire: {
        id: 'bonfire',
        name: 'Fogueira Shinobi',
        description: 'Fogueira aconchegante de lenha e pedras. Ilumina a noite e regenera energia vital ao repousar.',
        footprint: { width: 1, height: 1 },
        cost: { wood: 12, metal: 4 },
        maxHealth: 120
    }
};
