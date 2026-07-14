// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {RollType, PartialDie, type DamageForm, type DamageResult, type LastRoll, type SkillCheckResult, type ToHitResults} from 'core/dice';
import {accumulateStatistics, type StatisticsRoll} from 'core/statistics';
import {Button, Card, NumberField, Screen, SegmentedControl, Text, type Segment} from 'app/components';
import {useDieRoller} from 'app/providers/DiceProvider';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';

type Mode = 'skill' | 'hit' | 'normal' | 'killing' | 'effect';

const SEGMENTS: Segment[] = [
    {value: 'skill', label: 'Skill'},
    {value: 'hit', label: 'To Hit'},
    {value: 'normal', label: 'Normal'},
    {value: 'killing', label: 'Killing'},
    {value: 'effect', label: 'Effect'},
];

const toInt = (value: string, fallback: number): number => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const diceCount = (value: string): number => Math.max(1, toInt(value, 1));

const damageForm = (dice: number, damageType: RollType.NormalDamage | RollType.KillingDamage): DamageForm => ({
    dice,
    damageType,
    partialDie: PartialDie.None,
    stunMultiplier: 0,
    useHitLocations: false,
    useFifthEdition: false,
    isMartialManeuver: false,
    isTargetFlying: false,
    isTargetInZeroG: false,
    isTargetUnderwater: false,
    rollWithPunch: false,
    isUsingClinging: false,
    isExplosion: false,
    fadeRate: 5,
    sfx: null,
});

const rollFor = (roller: ReturnType<typeof useDieRoller>, mode: Mode, inputs: Record<string, string>): LastRoll => {
    switch (mode) {
        case 'skill':
            return roller.rollCheck(`${toInt(inputs.threshold, 11)}-`);
        case 'hit':
            return roller.rollToHit(toInt(inputs.ocv, 0), 1, false, toInt(inputs.dcv, 0));
        case 'normal':
            return roller.rollDamage(damageForm(diceCount(inputs.dice), RollType.NormalDamage));
        case 'killing':
            return roller.rollDamage(damageForm(diceCount(inputs.dice), RollType.KillingDamage));
        case 'effect':
            return roller.rollEffect({dice: diceCount(inputs.dice), partialDie: PartialDie.None});
        default:
            throw new Error(`unknown roll mode: ${mode as string}`);
    }
};

const toStatisticsRolls = (result: LastRoll): StatisticsRoll[] => {
    if ('results' in result) {
        return result.results.map((hit) => ({rollType: hit.rollType, rolls: hit.rolls}));
    }
    if (result.rollType === RollType.NormalDamage || result.rollType === RollType.KillingDamage) {
        return [{rollType: result.rollType, rolls: result.rolls, stun: result.stun, body: result.body, knockback: result.knockback, hitLocationDetails: result.hitLocationDetails}];
    }
    return [{rollType: result.rollType, rolls: result.rolls}];
};

export function DiceScreen(): React.JSX.Element {
    const roller = useDieRoller();
    const {statistics} = useRepositories();
    const [mode, setMode] = useState<Mode>('skill');
    const [inputs, setInputs] = useState<Record<string, string>>({threshold: '11', ocv: '8', dcv: '5', dice: '6'});
    const [last, setLast] = useState<LastRoll | null>(null);
    const [diceRolled, setDiceRolled] = useState<number | null>(null);

    const setInput = (key: string) => (value: string) => setInputs((prev) => ({...prev, [key]: value}));

    const record = useCallback(
        async (result: LastRoll) => {
            let stats = await statistics.get();
            for (const roll of toStatisticsRolls(result)) {
                stats = accumulateStatistics(stats, roll);
            }
            await statistics.save(stats);
            setDiceRolled(stats.totals.diceRolled);
        },
        [statistics],
    );

    const performRoll = useCallback(async () => {
        const result = rollFor(roller, mode, inputs);
        setLast(result);
        await record(result);
    }, [roller, mode, inputs, record]);

    const rollAgain = useCallback(async () => {
        if (last === null) {
            return;
        }
        const result = roller.rollAgain(last);
        setLast(result);
        await record(result);
    }, [roller, last, record]);

    return (
        <Screen>
            <View style={styles.container}>
                <SegmentedControl segments={SEGMENTS} value={mode} onChange={(value) => setMode(value as Mode)} />

                <Inputs mode={mode} inputs={inputs} setInput={setInput} />

                <View style={styles.actions}>
                    <View style={styles.grow}>
                        <Button testID="roll" label="Roll" onPress={performRoll} />
                    </View>
                    <View style={styles.grow}>
                        <Button testID="roll-again" label="Roll Again" variant="secondary" disabled={last === null} onPress={rollAgain} />
                    </View>
                </View>

                {last !== null ? <ResultView result={last} /> : null}

                {diceRolled !== null ? (
                    <Text variant="caption" muted>
                        {`Dice rolled all-time: ${diceRolled}`}
                    </Text>
                ) : null}
            </View>
        </Screen>
    );
}

function Inputs({mode, inputs, setInput}: {mode: Mode; inputs: Record<string, string>; setInput: (key: string) => (value: string) => void}): React.JSX.Element {
    if (mode === 'skill') {
        return (
            <View style={styles.row}>
                <NumberField testID="input-threshold" label="Target (roll under)" value={inputs.threshold} onChangeText={setInput('threshold')} />
            </View>
        );
    }
    if (mode === 'hit') {
        return (
            <View style={styles.row}>
                <NumberField testID="input-ocv" label="OCV" value={inputs.ocv} onChangeText={setInput('ocv')} />
                <NumberField testID="input-dcv" label="Target DCV" value={inputs.dcv} onChangeText={setInput('dcv')} />
            </View>
        );
    }
    return (
        <View style={styles.row}>
            <NumberField testID="input-dice" label="Dice (d6)" value={inputs.dice} onChangeText={setInput('dice')} />
        </View>
    );
}

function ResultView({result}: {result: LastRoll}): React.JSX.Element {
    if ('results' in result) {
        return <ToHitView result={result} />;
    }
    if (result.rollType === RollType.SkillCheck) {
        return <SkillView result={result} />;
    }
    if (result.rollType === RollType.NormalDamage || result.rollType === RollType.KillingDamage) {
        return <DamageView result={result} />;
    }
    return (
        <ResultCard dice={result.rolls}>
            <Stat label="Effect" value={String(result.total)} />
        </ResultCard>
    );
}

function SkillView({result}: {result: SkillCheckResult}): React.JSX.Element {
    const threshold = Number(result.threshold);
    const hasThreshold = result.threshold !== -1 && !Number.isNaN(threshold);
    const margin = threshold - result.total;

    return (
        <ResultCard dice={result.rolls}>
            <Stat label="Rolled" value={String(result.total)} />
            {hasThreshold ? <Stat label={margin >= 0 ? 'Made by' : 'Missed by'} value={String(Math.abs(margin))} success={margin >= 0} /> : null}
        </ResultCard>
    );
}

function ToHitView({result}: {result: ToHitResults}): React.JSX.Element {
    const hit = result.results[0];
    const hits = hit.targetDcv <= hit.hitCv;

    return (
        <ResultCard dice={hit.rolls}>
            <Stat label="Rolled" value={String(hit.total)} />
            <Stat label="Hits DCV ≤" value={String(hit.hitCv)} />
            <Stat label="vs DCV" value={hits ? 'HIT' : 'MISS'} success={hits} />
        </ResultCard>
    );
}

function DamageView({result}: {result: DamageResult}): React.JSX.Element {
    return (
        <ResultCard dice={result.rolls}>
            <Stat label="STUN" value={String(result.stun)} />
            <Stat label="BODY" value={String(result.body)} />
            <Stat label="Knockback" value={`${Math.max(0, result.knockback)}m`} />
        </ResultCard>
    );
}

function ResultCard({dice, children}: {dice: number[]; children: React.ReactNode}): React.JSX.Element {
    return (
        <Card>
            <View style={styles.stats}>{children}</View>
            <Text variant="caption" muted style={styles.dice}>
                {dice.join('  ·  ')}
            </Text>
        </Card>
    );
}

function Stat({label, value, success}: {label: string; value: string; success?: boolean}): React.JSX.Element {
    const theme = useTheme();
    const color = success === undefined ? undefined : success ? theme.colors.active : theme.colors.danger;

    return (
        <View style={styles.stat}>
            <Text variant="caption" muted>
                {label}
            </Text>
            <Text variant="title" color={color}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        rowGap: 16,
    },
    row: {
        flexDirection: 'row',
        columnGap: 12,
    },
    actions: {
        flexDirection: 'row',
        columnGap: 12,
    },
    grow: {
        flex: 1,
    },
    stats: {
        flexDirection: 'row',
        columnGap: 24,
        flexWrap: 'wrap',
        rowGap: 8,
    },
    stat: {
        rowGap: 2,
    },
    dice: {
        marginTop: 12,
    },
});
