import { ChevronLeft, Information } from '@carbon/icons-react';
import { Button, Tile } from '@carbon/react';
import { CardHeader } from '../components/CardHeader';
import { InfoBlock } from '../components/InfoBlock';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
}

export function CalculationInfoPage({ onBack }: Props) {
  return (
    <PageContainer
      title="Como calculamos suas metas"
      subtitle="Resumo das fórmulas usadas no FitTrack"
      actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}
    >
      <div className="stack">
        <Tile className="card metric-card goals-card">
          <CardHeader
            icon={<Information size={20} />}
            title="Visão geral"
            description="As metas são estimativas para acompanhamento diário"
          />
          <InfoBlock>
            O FitTrack usa peso, altura, data de nascimento, sexo, nível de atividade, objetivo e tipo de dieta para estimar calorias, macros e água. As fórmulas servem como referência prática e não substituem orientação profissional.
          </InfoBlock>
        </Tile>

        <Tile className="card metric-card goals-card">
          <CardHeader
            icon={<Information size={20} />}
            title="Calorias"
            description="TMB, gasto diário e ajuste do objetivo"
          />
          <div className="calculation-list">
            <div>
              <strong>TMB</strong>
              <p>Mifflin-St Jeor: 10 × peso + 6,25 × altura - 5 × idade + ajuste por sexo.</p>
            </div>
            <div>
              <strong>Gasto diário</strong>
              <p>TMB × fator de atividade: 1,2 sedentário, 1,375 leve, 1,55 moderado, 1,725 intenso ou 1,9 atleta.</p>
            </div>
            <div>
              <strong>Meta calórica</strong>
              <p>Gasto diário com ajuste de objetivo: -350 kcal para perda de gordura, 0 para manutenção e +250 kcal para ganho de massa. O mínimo exibido é 1200 kcal.</p>
            </div>
          </div>
        </Tile>

        <Tile className="card metric-card goals-card">
          <CardHeader
            icon={<Information size={20} />}
            title="Macronutrientes e água"
            description="Distribuição por peso e tipo de dieta"
          />
          <div className="calculation-list">
            <div>
              <strong>Proteína</strong>
              <p>Calculada por peso: 1,8 g/kg na dieta equilibrada, 2,0 g/kg na baixa em carboidrato e 1,7 g/kg na alta em carboidrato.</p>
            </div>
            <div>
              <strong>Carboidratos e gorduras</strong>
              <p>O app usa 4 kcal por grama de proteína/carboidrato e 9 kcal por grama de gordura. Na baixa em carboidrato, carboidratos ficam em 1,5 g/kg e gordura completa as calorias. Nas outras dietas, gordura é definida por peso e carboidratos completam as calorias.</p>
            </div>
            <div>
              <strong>Água</strong>
              <p>Meta diária estimada em 35 ml por kg de peso corporal.</p>
            </div>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
