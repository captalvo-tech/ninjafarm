<?php
/**
 * ============================================================================
 * INSTRUCAO DE BACKUP / BACKUP INSTRUCTION:
 * ============================================================================
 * Todos os backups deste projeto (arquivos, banco de dados ou versoes) DEVEM ser
 * armazenados exclusivamente na pasta central de backups de sites do servidor:
 *   /domains/_backups_todos_sites/
 * criando e mantendo sempre a pasta respectiva deste dominio:
 *   /domains/_backups_todos_sites/pinut.shop/
 *
 * NUNCA crie backups dentro da pasta public_html ou em diretorios expostos na web.
 * ============================================================================
 */
?>
<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
        <title>Ninja Farm — Fazenda Ninja (pinut.shop)</title>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥷</text></svg>">
        <meta content="IE=edge,chrome=1" http-equiv="X-UA-Compatible">
        <meta content="Ninja Farm — Jogo 3D de Fazenda Autossustentável e Táticas Ninja" name="description">
        <meta content="width=device-width, initial-scale=1" name="viewport">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Cinzel:wght@700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #10B981;
                --primary-dark: #059669;
                --ninja-black: #0B0F19;
                --ninja-card: #141B2D;
                --ninja-border: rgba(255, 255, 255, 0.08);
                --accent: #E11D48;
                --text-main: #F3F4F6;
                --text-muted: #9CA3AF;
                --bg-gradient: radial-gradient(circle at 50% 20%, #1A2338 0%, #0B0F19 80%);
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                min-height: 100vh;
                background: var(--ninja-black);
                background-image: var(--bg-gradient);
                color: var(--text-main);
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                overflow-x: hidden;
            }

            .navigation {
                width: 100%;
                height: 72px;
                display: flex;
                margin: 0;
                padding: 0 24px;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                background: rgba(11, 15, 25, 0.85);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid var(--ninja-border);
                position: sticky;
                top: 0;
                z-index: 50;
            }

            .brand-logo {
                display: flex;
                align-items: center;
                gap: 12px;
                text-decoration: none;
                color: #FFFFFF;
            }

            .brand-icon {
                width: 38px;
                height: 38px;
                border-radius: 10px;
                background: linear-gradient(135deg, #10B981 0%, #064E3B 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.35);
            }

            .brand-title {
                font-family: 'Cinzel', serif;
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 1.5px;
                background: linear-gradient(90deg, #FFFFFF, #D1D5DB);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .env-badge {
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                padding: 4px 10px;
                border-radius: 20px;
                background: rgba(225, 29, 72, 0.15);
                border: 1px solid rgba(225, 29, 72, 0.4);
                color: #FDA4AF;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .env-badge::before {
                content: "";
                display: inline-block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #E11D48;
                box-shadow: 0 0 8px #E11D48;
            }

            .content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                max-width: 960px;
                padding: 40px 20px 80px 20px;
                flex: 1;
                text-align: center;
            }

            .hero-badge {
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: var(--primary);
                background: rgba(16, 185, 129, 0.12);
                border: 1px solid rgba(16, 185, 129, 0.3);
                padding: 6px 16px;
                border-radius: 50px;
                margin-bottom: 20px;
                display: inline-block;
            }

            h1 {
                font-family: 'Cinzel', serif;
                font-size: clamp(32px, 6vw, 54px);
                font-weight: 900;
                letter-spacing: -0.5px;
                line-height: 1.15;
                margin: 0 0 16px 0;
                background: linear-gradient(135deg, #FFFFFF 30%, #9CA3AF 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            p.subtitle {
                font-size: clamp(16px, 2.5vw, 19px);
                line-height: 1.6;
                max-width: 640px;
                color: var(--text-muted);
                margin: 0 auto 36px auto;
            }

            .main-visual {
                position: relative;
                width: 100%;
                max-width: 680px;
                border-radius: 20px;
                padding: 24px;
                background: linear-gradient(180deg, rgba(20, 27, 45, 0.8) 0%, rgba(11, 15, 25, 0.95) 100%);
                border: 1px solid var(--ninja-border);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.08);
                margin-bottom: 40px;
            }

            .visual-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-top: 16px;
            }

            .feature-pill {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid var(--ninja-border);
                border-radius: 12px;
                padding: 16px 12px;
                text-align: center;
                transition: transform 0.2s, border-color 0.2s;
            }

            .feature-pill:hover {
                transform: translateY(-2px);
                border-color: rgba(16, 185, 129, 0.4);
            }

            .feature-icon {
                font-size: 26px;
                margin-bottom: 8px;
            }

            .feature-title {
                font-weight: 700;
                font-size: 14px;
                color: #FFFFFF;
                margin-bottom: 4px;
            }

            .feature-desc {
                font-size: 12px;
                color: var(--text-muted);
                line-height: 1.4;
            }

            .cta-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 14px;
            }

            .btn-enter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-family: 'DM Sans', sans-serif;
                font-size: 18px;
                font-weight: 700;
                color: #0B0F19;
                background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
                border: none;
                border-radius: 14px;
                padding: 18px 44px;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4);
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .btn-enter:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 14px 35px rgba(16, 185, 129, 0.55);
            }

            .btn-enter:active {
                transform: translateY(1px);
            }

            .cta-hint {
                font-size: 13px;
                color: var(--text-muted);
            }

            /* MODAL STYLES */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(3, 7, 18, 0.85);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.25s ease, visibility 0.25s;
                padding: 16px;
            }

            .modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .modal-card {
                background: var(--ninja-card);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 24px;
                width: 100%;
                max-width: 580px;
                padding: 32px;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.1);
                transform: scale(0.92) translateY(20px);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                text-align: left;
            }

            .modal-overlay.active .modal-card {
                transform: scale(1) translateY(0);
            }

            .modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ninja-border);
                color: var(--text-muted);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s, color 0.2s;
            }

            .modal-close:hover {
                background: rgba(225, 29, 72, 0.2);
                color: #FDA4AF;
                border-color: rgba(225, 29, 72, 0.4);
            }

            .modal-header {
                margin-bottom: 24px;
            }

            .modal-header h2 {
                font-family: 'Cinzel', serif;
                font-size: 26px;
                margin: 0 0 8px 0;
                color: #FFFFFF;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .modal-header p {
                font-size: 14px;
                color: var(--text-muted);
                margin: 0;
            }

            .modal-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 24px;
            }

            .option-card {
                display: flex;
                align-items: center;
                gap: 16px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid var(--ninja-border);
                border-radius: 14px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                color: inherit;
            }

            .option-card:hover {
                background: rgba(16, 185, 129, 0.08);
                border-color: rgba(16, 185, 129, 0.4);
                transform: translateX(4px);
            }

            .option-card.selected {
                background: rgba(16, 185, 129, 0.12);
                border-color: var(--primary);
            }

            .option-icon {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                flex-shrink: 0;
            }

            .option-card:hover .option-icon {
                background: rgba(16, 185, 129, 0.2);
            }

            .option-details {
                flex: 1;
            }

            .option-title {
                font-weight: 700;
                font-size: 15px;
                color: #FFFFFF;
                margin-bottom: 2px;
            }

            .option-desc {
                font-size: 12px;
                color: var(--text-muted);
            }

            .modal-footer {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                border-top: 1px solid var(--ninja-border);
                padding-top: 20px;
            }

            .btn-modal-action {
                font-family: 'DM Sans', sans-serif;
                font-size: 15px;
                font-weight: 700;
                padding: 12px 26px;
                border-radius: 10px;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .btn-primary-action {
                background: var(--primary);
                color: #0B0F19;
            }

            .btn-primary-action:hover {
                background: #34D399;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
            }

            .btn-secondary-action {
                background: rgba(255, 255, 255, 0.06);
                color: var(--text-main);
                border: 1px solid var(--ninja-border);
            }

            .btn-secondary-action:hover {
                background: rgba(255, 255, 255, 0.12);
            }

            @media screen and (max-width: 600px) {
                .visual-grid {
                    grid-template-columns: 1fr;
                }
                .navigation {
                    padding: 0 16px;
                }
                .modal-card {
                    padding: 24px 18px;
                }
                .btn-enter {
                    width: 100%;
                    padding: 16px 24px;
                }
            }
        </style>
    </head>
    <body>
        <nav class="navigation">
            <a href="#" class="brand-logo">
                <div class="brand-icon">🥷</div>
                <div class="brand-title">NINJA FARM</div>
            </a>
            <div class="env-badge">pinut.shop &bull; Fase 1</div>
        </nav>

        <div class="content">
            <div class="hero-badge">3D Browser Experience &bull; Standalone</div>
            <h1>FAZENDA NINJA</h1>
            <p class="subtitle">
                Construa sua base autossustentável em um mundo 3D completo. Gerencie energia solar, recursos hídricos, agricultura modular e comande seu ninja em tempo real.
            </p>

            <div class="main-visual">
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--primary); margin-bottom: 8px;">
                    [ STATUS DO AMBIENTE: GRADE 64&times;36 &bull; PLAYCANVAS STANDALONE 3D ]
                </div>
                <div class="visual-grid">
                    <div class="feature-pill">
                        <div class="feature-icon">🌾</div>
                        <div class="feature-title">Agricultura & Recursos</div>
                        <div class="feature-desc">Canteiros modulares, arroz, hortaliças e ciclos vitais com irrigação.</div>
                    </div>
                    <div class="feature-pill">
                        <div class="feature-icon">⚡</div>
                        <div class="feature-title">Energia & Baterias</div>
                        <div class="feature-desc">Geração fotovoltaica diurna, bancos de bateria e rede autossustentável.</div>
                    </div>
                    <div class="feature-pill">
                        <div class="feature-icon">🎮</div>
                        <div class="feature-title">Controle 3D Total</div>
                        <div class="feature-desc">Locomoção do ninja em 3ª pessoa e visão estratégica para construção.</div>
                    </div>
                </div>
            </div>

            <div class="cta-container">
                <button class="btn-enter" id="btnOpenModal" type="button">
                    <span>ENTRAR NO JOGO</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
                <div class="cta-hint">Acesso imediato via navegador &bull; Desktop e Mobile</div>
            </div>
        </div>

        <!-- MODAL ONDE TUDO COMEÇA -->
        <div class="modal-overlay" id="startModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div class="modal-card">
                <button class="modal-close" id="btnCloseModal" aria-label="Fechar">&times;</button>
                <div class="modal-header">
                    <h2 id="modalTitle">🥷 Onde Tudo Começa</h2>
                    <p>Selecione seu ponto de partida para entrar na Fazenda Ninja:</p>
                </div>

                <div class="modal-options">
                    <div class="option-card selected" id="optNewGame" onclick="selectOption(this, 'new')">
                        <div class="option-icon">🌱</div>
                        <div class="option-details">
                            <div class="option-title">Nova Fazenda (Fase 1)</div>
                            <div class="option-desc">Iniciar o assentamento com sede 3D, ninja ativo e grade 64&times;36.</div>
                        </div>
                    </div>

                    <div class="option-card" id="optBenchmark" onclick="selectOption(this, 'benchmark')">
                        <div class="option-icon">⚙️</div>
                        <div class="option-details">
                            <div class="option-title">Modo Sandbox & Validação M1</div>
                            <div class="option-desc">Carregar cena de demonstração 3D, câmera e teste de desempenho.</div>
                        </div>
                    </div>

                    <div class="option-card" id="optLoadGame" onclick="selectOption(this, 'load')">
                        <div class="option-icon">💾</div>
                        <div class="option-details">
                            <div class="option-title">Carregar Progresso Local</div>
                            <div class="option-desc">Recuperar dados salvos no navegador via IndexedDB.</div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-modal-action btn-secondary-action" id="btnCancelModal" type="button">Voltar</button>
                    <button class="btn-modal-action btn-primary-action" id="btnLaunchGame" type="button" onclick="launchGame()">
                        <span>Iniciar Experiência</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <script>
            let selectedMode = 'new';
            const modal = document.getElementById('startModal');
            const btnOpen = document.getElementById('btnOpenModal');
            const btnClose = document.getElementById('btnCloseModal');
            const btnCancel = document.getElementById('btnCancelModal');

            function openModal() {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            function closeModal() {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }

            btnOpen.addEventListener('click', openModal);
            btnClose.addEventListener('click', closeModal);
            btnCancel.addEventListener('click', closeModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeModal();
                }
            });

            function selectOption(el, mode) {
                document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                el.classList.add('selected');
                selectedMode = mode;
            }

            function launchGame() {
                // Se houver client compilado no diretório (/dist ou index.html), redireciona ou abre
                window.location.href = 'index.html?mode=' + encodeURIComponent(selectedMode);
            }
        </script>
    </body>
</html>

