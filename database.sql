-- ============================================================
--  AquaWash - Script de criação do banco de dados
--  Tabelas em português
-- ============================================================

CREATE DATABASE IF NOT EXISTS `carwash`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `carwash`;

-- Tabela: usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  `nome`         VARCHAR(255) NOT NULL,
  `email`        VARCHAR(255) NOT NULL,
  `senha`        VARCHAR(255) NOT NULL,
  `perfil`       ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  `telefone`     VARCHAR(20)  NULL,
  `foto_perfil`  VARCHAR(255) NULL,
  `criadoEm`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizadoEm` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: servico
CREATE TABLE IF NOT EXISTS `servico` (
  `id`           VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  `nome`         VARCHAR(255)   NOT NULL,
  `descricao`    TEXT           NOT NULL,
  `preco`        DECIMAL(10,2)  NOT NULL,
  `duracao`      INT            NOT NULL,
  `tiposVeiculo` VARCHAR(255)   NOT NULL DEFAULT 'carro',
  `ativo`        TINYINT(1)     NOT NULL DEFAULT 1,
  `imagemUrl`    VARCHAR(255)   NULL,
  `criadoEm`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizadoEm` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: veiculo
CREATE TABLE IF NOT EXISTS `veiculo` (
  `id`           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  `usuarioId`    VARCHAR(36)  NOT NULL,
  `marca`        VARCHAR(255) NOT NULL,
  `modelo`       VARCHAR(255) NOT NULL,
  `ano`          INT          NOT NULL,
  `placa`        VARCHAR(10)  NOT NULL,
  `cor`          VARCHAR(255) NOT NULL,
  `tipo`         ENUM('carro','moto','caminhao','suv') NOT NULL DEFAULT 'carro',
  `criadoEm`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizadoEm` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `veiculo_placa_unique` (`placa`),
  CONSTRAINT `fk_veiculo_usuario`
    FOREIGN KEY (`usuarioId`) REFERENCES `usuario` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: agendamento
CREATE TABLE IF NOT EXISTS `agendamento` (
  `id`           VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  `usuarioId`    VARCHAR(36)   NOT NULL,
  `veiculoId`    VARCHAR(36)   NOT NULL,
  `servicoId`    VARCHAR(36)   NOT NULL,
  `agendadoPara` DATETIME      NOT NULL,
  `status`       ENUM('pendente','em_andamento','concluido','cancelado') NOT NULL DEFAULT 'pendente',
  `observacoes`  VARCHAR(255)  NULL,
  `precoTotal`   DECIMAL(10,2) NOT NULL,
  `criadoEm`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizadoEm` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_agendamento_usuario`
    FOREIGN KEY (`usuarioId`) REFERENCES `usuario` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_agendamento_veiculo`
    FOREIGN KEY (`veiculoId`) REFERENCES `veiculo` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_agendamento_servico`
    FOREIGN KEY (`servicoId`) REFERENCES `servico` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais: serviços de exemplo
INSERT IGNORE INTO `servico` (`id`, `nome`, `descricao`, `preco`, `duracao`, `tiposVeiculo`, `ativo`) VALUES
  (UUID(), 'Lavagem Simples',    'Lavagem externa completa com água e sabão',                          35.00,  30, 'carro,moto,suv',            1),
  (UUID(), 'Lavagem Completa',   'Lavagem interna e externa com aspiração e limpeza de vidros',        65.00,  60, 'carro,suv,caminhao',         1),
  (UUID(), 'Polimento',          'Polimento completo da lataria com cera protetora',                  120.00,  90, 'carro,suv',                  1),
  (UUID(), 'Higienização',       'Higienização completa do interior com produtos especializados',     150.00, 120, 'carro,suv,caminhao',         1),
  (UUID(), 'Lavagem Moto',       'Lavagem completa para motocicletas',                                 25.00,  20, 'moto',                       1),
  (UUID(), 'Lavagem Caminhão',   'Lavagem externa para caminhões e veículos de grande porte',         100.00,  90, 'caminhao',                   1);
